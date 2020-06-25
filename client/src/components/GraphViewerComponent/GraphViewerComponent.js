// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

import { GraphViewerCommandBarComponent } from "./GraphViewerCommandBarComponent/GraphViewerCommandBarComponent";
import { GraphViewerCytoscapeComponent, GraphViewerCytoscapeLayouts } from "./GraphViewerCytoscapeComponent/GraphViewerCytoscapeComponent";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { print } from "../../services/LoggingService";
import { BatchService } from "../../services/BatchService";
import { settingsService } from "../../services/SettingsService";
import { REL_TYPE_OUTGOING } from "../../services/Constants";
import { getUniqueRelationshipId } from "../../utils/utilities";

import "./GraphViewerComponent.scss";

export class GraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      selectedNode: null,
      selectedNodes: null,
      layout: "Klay"
    };
    this.cyRef = React.createRef();
    this.commandRef = React.createRef();
    this.canceled = false;
  }

  componentDidMount() {
    eventService.subscribeQuery(data => this.getData(data.query));
    eventService.subscribeDeleteTwin(id => {
      if (id) {
        this.onTwinDelete(id);
      }
    });
    eventService.subscribeAddRelationship(data => data && this.onRelationshipCreate(data));
    eventService.subscribeDeleteRelationship(data => data && this.onRelationshipDelete(data));
    eventService.subscribeCreateTwin(data => {
      this.cyRef.current.addTwins([ data ]);
      this.cyRef.current.doLayout();
    });
    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        this.clearData();
      }
    });
    eventService.subscribeClearData(() => {
      this.clearData();
    });
  }

  clearData() {
    eventService.publishSelection();
    this.cyRef.current.clearTwins();
  }

  updateProgress(newProgress) {
    if (this.canceled) {
      const e = new Error("Operation canceled by user");
      e.errorCode = "user_cancelled";
      throw e;
    }

    const { progress } = this.state;
    if (newProgress >= 0 && newProgress > progress) {
      this.setState({ isLoading: newProgress < 100, progress: newProgress >= 100 ? 0 : newProgress });
    }
  }

  async getData(query) {
    const { isLoading } = this.state;
    if (!query || isLoading) {
      return;
    }

    this.setState({ query });
    this.canceled = false;

    try {
      const allTwins = await this.getTwinsData(query);
      await this.getRelationshipsData(allTwins, 30, false, true, REL_TYPE_OUTGOING);
    } catch (e) {
      if (e.errorCode !== "user_cancelled") {
        print(`*** Error fetching data for graph: ${e}`, "error");
        eventService.publishError(`*** Error fetching data for graph: ${e}`);
      }
    }

    this.setState({ isLoading: false, progress: 0 });
  }

  async getTwinsData(query) {
    const allTwins = [];
    const existingTwins = this.cyRef.current.getTwins();
    this.updateProgress(5);

    await apiService.queryTwinsPaged(query, async twins => {
      this.cyRef.current.addTwins(twins);
      await this.cyRef.current.doLayout();
      twins.forEach(x => allTwins.push(x));
      this.updateProgress();
    });
    this.updateProgress(25);

    const removeTwins = existingTwins.filter(x => allTwins.every(y => y.$dtId !== x));
    this.cyRef.current.removeTwins(removeTwins);

    return allTwins;
  }

  async getRelationshipsData(twins, baseline = 0, loadTargets = false, clearExisting = false,
    relTypeLoading = REL_TYPE_OUTGOING, expansionLevel = 1) {
    this.updateProgress(baseline);

    const allRels = [];
    const existingRels = clearExisting ? this.cyRef.current.getRelationships() : [];

    const allTwins = [ ...twins ];
    const existingTwins = [];
    for (let i = 0; i < expansionLevel; i++) {
      const baselineChunk = (100 - baseline) / expansionLevel;
      const currentTwins = allTwins.filter(x => existingTwins.every(y => y.$dtId !== x.$dtId));
      existingTwins.push(...currentTwins);

      const bs = new BatchService({
        refresh: () => this.cyRef.current.doLayout(),
        update: p => this.updateProgress(baseline + (i * baselineChunk) + ((p / 100) * baselineChunk)),
        items: currentTwins,
        action: (twin, resolve, reject) => {
          if (this.canceled) {
            resolve();
          }
          apiService
            .queryRelationshipsPaged(twin.$dtId, async rels => {
              try {
                let presentRels = rels;
                if (settingsService.eagerLoading || loadTargets) {
                  const missingTwins = [];
                  for (const rel of rels) {
                    for (const prop of [ "$sourceId", "$targetId" ]) {
                      // eslint-disable-next-line max-depth
                      if (rel[prop] && allTwins.every(x => x.$dtId !== rel[prop])) {
                        const missingTwin = await apiService.getTwinById(rel[prop]);
                        [ missingTwins, allTwins ].forEach(x => x.push(missingTwin));
                      }
                    }
                  }

                  this.cyRef.current.addTwins(missingTwins);
                } else {
                  presentRels = rels.filter(x =>
                    allTwins.some(y => y.$dtId === x.$sourceId) && allTwins.some(y => y.$dtId === x.$targetId));
                }

                this.cyRef.current.addRelationships(presentRels);
                presentRels.forEach(x => allRels.push(x));
                if (!rels.nextLink) {
                  resolve();
                }
              } catch (e) {
                reject(e);
              }
            }, relTypeLoading)
            .then(null, exc => {
              // If the twin has been deleted, warn but don't block the graph render
              print(`*** Error fetching data for twin: ${exc}`, "warning");
              resolve();
            });
        }
      });

      await bs.run();
    }

    if (clearExisting) {
      const removeRels = existingRels.filter(x => allRels.every(y => getUniqueRelationshipId(y) !== x));
      this.cyRef.current.removeRelationships(removeRels);
    }
  }

  onNodeClicked = async e => {
    this.setState({ selectedNode: e.selectedNode, selectedNodes: e.selectedNodes });
    if (e.selectedNode) {
      try {
        const data = await apiService.getTwinById(e.selectedNode.id);
        if (data) {
          eventService.publishSelection(data);
        }
      } catch (exc) {
        print(`*** Error fetching data for twin: ${exc}`, "error");
        eventService.publishSelection();
      }
    } else {
      eventService.publishSelection();
    }
  }

  onNodeDoubleClicked = async e => {
    try {
      await this.getRelationshipsData([ { $dtId: e.id } ], 10, true, false,
        settingsService.relTypeLoading, settingsService.relExpansionLevel);
    } catch (exc) {
      print(`*** Error fetching data for graph: ${exc}`, "error");
      eventService.publishError(`*** Error fetching data for graph: ${exc}`);
    }

    this.setState({ isLoading: false, progress: 0 });
  }

  onControlClicked = () => {
    this.setState({ selectedNode: null, selectedNodes: null });
    eventService.publishSelection();
  }

  onTwinDelete = async ids => {
    if (ids) {
      this.cyRef.current.removeTwins(ids);
      await this.cyRef.current.doLayout();
    } else {
      this.cyRef.current.clearTwins();
    }
    eventService.publishSelection();
  }

  onRelationshipCreate = async relationship => {
    if (relationship) {
      this.cyRef.current.addRelationships([ relationship ]);
      await this.cyRef.current.doLayout();
    }
  }

  onRelationshipDelete = async relationship => {
    if (relationship) {
      this.cyRef.current.removeRelationships([ getUniqueRelationshipId(relationship) ]);
      await this.cyRef.current.doLayout();
    }
  }

  onLayoutChanged = layout => {
    this.setState({ layout });
    this.cyRef.current.setLayout(layout);
    this.cyRef.current.doLayout();
  }

  render() {
    const { selectedNode, selectedNodes, isLoading, query, progress, layout } = this.state;
    return (
      <div className="gc-grid">
        <div className="gc-toolbar">
          <GraphViewerCommandBarComponent className="gc-commandbar" buttonClass="gc-toolbarButtons" ref={this.commandRef}
            selectedNode={selectedNode} selectedNodes={selectedNodes} query={query}
            layouts={Object.keys(GraphViewerCytoscapeLayouts)} layout={layout}
            onRelationshipCreate={this.onRelationshipCreate}
            onTwinDelete={this.onTwinDelete}
            onLayoutClicked={() => this.cyRef.current.doLayout()}
            onZoomToFitClicked={() => this.cyRef.current.zoomToFit()}
            onCenterClicked={() => this.cyRef.current.center()}
            onLayoutChanged={this.onLayoutChanged}
            onGetCurrentNodes={() => this.cyRef.current.graphControl.nodes()} />
        </div>
        <div className="gc-wrap">
          <GraphViewerCytoscapeComponent ref={this.cyRef}
            onNodeClicked={this.onNodeClicked}
            onNodeDoubleClicked={this.onNodeDoubleClicked}
            onControlClicked={this.onControlClicked} />
        </div>
        {isLoading && <LoaderComponent message={`${Math.round(progress)}%`} cancel={() => this.canceled = true} />}
      </div>
    );
  }

}
