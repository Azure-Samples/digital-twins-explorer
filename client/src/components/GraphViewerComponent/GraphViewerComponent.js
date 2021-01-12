// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Icon } from "office-ui-fabric-react";

import { GraphViewerCommandBarComponent } from "./GraphViewerCommandBarComponent/GraphViewerCommandBarComponent";
import { GraphViewerCytoscapeComponent, GraphViewerCytoscapeLayouts } from "./GraphViewerCytoscapeComponent/GraphViewerCytoscapeComponent";
import { GraphViewerRelationshipCreateComponent } from "./GraphViewerRelationshipCreateComponent/GraphViewerRelationshipCreateComponent";
import { GraphViewerRelationshipViewerComponent } from "./GraphViewerRelationshipViewerComponent/GraphViewerRelationshipViewerComponent";
import { GraphViewerTwinDeleteComponent } from "./GraphViewerTwinDeleteComponent/GraphViewerTwinDeleteComponent";
import { GraphViewerRelationshipDeleteComponent } from "./GraphViewerRelationshipDeleteComponent/GraphViewerRelationshipDeleteComponent";
import { PropertyInspectorComponent } from "../PropertyInspectorComponent/PropertyInspectorComponent";
import GraphViewerFilteringComponent from "./GraphViewerFilteringComponent/GraphViewerFilteringComponent";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { apiService } from "../../services/ApiService";
import { ModelService } from "../../services/ModelService";
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
      selectedEdge: null,
      layout: "Klay",
      hideMode: "hide-selected",
      canShowAll: false,
      filterIsOpen: false,
      propertyInspectorIsOpen: true,
      canShowAllRelationships: false
    };
    this.view = React.createRef();
    this.create = React.createRef();
    this.delete = React.createRef();
    this.deleteRel = React.createRef();
    this.settings = React.createRef();
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
    eventService.subscribeModelIconUpdate(modelId => this.cyRef.current.updateModelIcon(modelId));
    eventService.subscribeCreateTwin(() => {
      this.cyRef.current.unselectSelectedNodes();
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
    const { isLoading, selectedNode } = this.state;
    if (!query || isLoading) {
      return;
    }

    this.setState({ query });
    this.canceled = false;

    try {
      this.cyRef.current.clearSelection();
      const allTwins = await this.getTwinsData(query);
      await this.getRelationshipsData(allTwins, 30, false, true, REL_TYPE_OUTGOING);
      if (selectedNode) {
        const selected = allTwins.find(t => t.$dtId === selectedNode.id);
        if (selected) {
          eventService.publishSelection(selected);
        } else {
          eventService.publishSelection();
        }
      }
    } catch (exc) {
      if (exc.errorCode !== "user_cancelled") {
        exc.customMessage = "Error fetching data for graph";
        eventService.publishError(exc);
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

  onEdgeClicked = e => {
    this.setState({ selectedEdge: e });
  }

  onNodeClicked = async e => {
    this.setState({ selectedNode: e.selectedNode, selectedNodes: e.selectedNodes });
    if (e.selectedNodes && e.selectedNodes.length > 1) {
      eventService.publishSelection();
    } else if (e.selectedNode) {
      try {
        const data = await apiService.getTwinById(e.selectedNode.id);
        // Get latest
        const { selectedNode } = this.state;
        if (data && selectedNode.id === e.selectedNode.id) {
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
      exc.customMessage = "Error fetching data for graph";
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false, progress: 0 });
  }

  onNodeMouseEnter = async modelId => {
    const modelService = new ModelService();
    const model = await apiService.getModelById(modelId);
    const properties = await modelService.getProperties(modelId);
    const relationships = await modelService.getRelationships(modelId);
    return {
      displayName: model && model.model ? model.model.displayName : "",
      description: model && model.model ? model.model.description : "",
      properties,
      relationships
    };
  };

  onControlClicked = () => {
    this.setState({ selectedNode: null, selectedNodes: null, selectedEdge: null });
    eventService.publishSelection();
  }

  onTwinDelete = async ids => {
    if (ids) {
      this.cyRef.current.removeTwins(ids);
      this.cyRef.current.clearSelection();
      await this.cyRef.current.doLayout();
    } else {
      this.cyRef.current.clearTwins();
    }
    this.setState({ selectedNode: null, selectedNodes: null });
    eventService.publishSelection();
  }

  onHide = () => this.setState({ hideMode: "hide-selected", canShowAll: true });

  onHideOthers = () => this.setState({ hideMode: "hide-others", canShowAll: true });

  onHideNonChildren = () => this.setState({ hideMode: "hide-non-children", canShowAll: true });

  onHideWithChildren = () => this.setState({ hideMode: "hide-with-children", canShowAll: true });

  onShowAll = () => {
    this.cyRef.current.showAllNodes();
    this.setState({ canShowAll: false });
  };

  onShowAllRelationships = () => {
    this.cyRef.current.showAllEdges();
    this.setState({ canShowAllRelationships: false });
  };

  onHideRelationship = () => {
    this.setState({ canShowAllRelationships: true });
  }

  onRelationshipCreate = async relationship => {
    if (relationship) {
      this.cyRef.current.addRelationships([ relationship ]);
      await this.cyRef.current.doLayout();
      this.setState({ selectedNode: null, selectedNodes: null });
      this.cyRef.current.unselectSelectedNodes();
      this.cyRef.current.clearSelection();
    } else {
      const { selectedNodes } = this.state;
      selectedNodes.pop();
      this.setState({ selectedNode: null, selectedNodes });
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

  onTriggerHide = () => {
    const { selectedNodes, hideMode } = this.state;
    if (selectedNodes && selectedNodes.length > 0) {
      switch (hideMode) {
        case "hide-selected":
          this.cyRef.current.hideSelectedTwins();
          break;
        case "hide-others":
          this.cyRef.current.hideOtherTwins();
          break;
        case "hide-non-children":
          this.cyRef.current.hideNonChildren();
          break;
        case "hide-with-children":
          this.cyRef.current.hideWithChildren();
          break;
        default:
          break;
      }
    }
    this.setState({ canShowAll: true });
  }

  onConfirmTwinDelete = ({ target: node }) => {
    let { selectedNode, selectedNodes } = this.state;
    if (node && node.id()) {
      if (!selectedNodes) {
        selectedNodes = [];
      }
      selectedNode = { id: node.id(), modelId: node.data().modelId };
      if (selectedNodes.filter(n => n.id === node.id()).length === 0) {
        selectedNodes.push({ id: node.id(), modelId: node.data().modelId });
      }
    }
    this.setState({ selectedNode, selectedNodes }, () => {
      this.delete.current.open();
    });
  }

  onConfirmRelationshipDelete = ({ target: node }) => {
    if (node && node.data()) {
      this.setState({ selectedEdge: node.data() }, () => {
        this.deleteRel.current.open();
      });
    }
  }

  onGetRelationships = ({ target: node }) => {
    let selectedNode = null;
    if (node && node.id()) {
      selectedNode = { id: node.id(), modelId: node.data().modelId };
    }
    this.setState({ selectedNode }, () => {
      this.view.current.open();
    });
  }

  toggleFilter = () => {
    const { filterIsOpen } = this.state;
    this.setState({ filterIsOpen: !filterIsOpen });
  }

  togglePropertyInspector = () => {
    const { propertyInspectorIsOpen } = this.state;
    this.setState({ propertyInspectorIsOpen: !propertyInspectorIsOpen });
  }

  onZoomIn = () => {
    this.cyRef.current.zoomIn();
  }

  onZoomOut = () => {
    this.cyRef.current.zoomOut();
  }

  onZoomToFit = () => {
    this.cyRef.current.zoomToFit();
  }

  onCenter = () => {
    this.cyRef.current.center();
  }

  onConfirmRelationshipCreate = node => {
    const { selectedNodes } = this.state;
    selectedNodes.push(node);
    this.setState({ selectedNode: node, selectedNodes }, () => {
      this.create.current.open();
    });
  }

  render() {
    const { selectedNode, selectedNodes, selectedEdge, isLoading, query, progress, layout, hideMode, canShowAll, canShowAllRelationships, filterIsOpen, propertyInspectorIsOpen } = this.state;
    return (
      <div className={`gvc-wrap ${propertyInspectorIsOpen ? "pi-open" : "pi-closed"}`}>
        <div className={`gc-grid ${filterIsOpen ? "open" : "closed"}`}>
          <div className="gc-toolbar">
            <GraphViewerCommandBarComponent className="gc-commandbar" buttonClass="gc-toolbarButtons" ref={this.commandRef}
              selectedNode={selectedNode} selectedNodes={selectedNodes} query={query} selectedEdge={selectedEdge}
              layouts={Object.keys(GraphViewerCytoscapeLayouts)} layout={layout} hideMode={hideMode}
              onRelationshipCreate={this.onRelationshipCreate}
              onShowAllRelationships={this.onShowAllRelationships}
              onTwinDelete={this.onTwinDelete}
              onHideOthers={this.onHideOthers}
              onHideNonChildren={this.onHideNonChildren}
              onHide={this.onHide}
              onHideWithChildren={this.onHideWithChildren}
              onTriggerHide={this.onTriggerHide}
              onShowAll={this.onShowAll}
              canShowAll={canShowAll}
              canShowAllRelationships={canShowAllRelationships}
              onLayoutClicked={() => this.cyRef.current.doLayout()}
              onZoomToFitClicked={() => this.cyRef.current.zoomToFit()}
              onCenterClicked={() => this.cyRef.current.center()}
              onLayoutChanged={this.onLayoutChanged}
              onGetCurrentNodes={() => this.cyRef.current.graphControl.nodes()} />
            <GraphViewerRelationshipCreateComponent ref={this.create}
              selectedNode={selectedNode} selectedNodes={selectedNodes}
              onCreate={this.onRelationshipCreate} />
            <GraphViewerRelationshipViewerComponent selectedNode={selectedNode} ref={this.view} />
            <GraphViewerTwinDeleteComponent selectedNode={selectedNode} selectedNodes={selectedNodes} query={query} ref={this.delete}
              onDelete={this.onTwinDelete} onGetCurrentNodes={() => this.cyRef.current.graphControl.nodes()} />
            <GraphViewerRelationshipDeleteComponent selectedEdge={selectedEdge} ref={this.deleteRel} />
          </div>
          <div className="gc-wrap">
            <GraphViewerCytoscapeComponent ref={this.cyRef}
              onEdgeClicked={this.onEdgeClicked}
              onNodeClicked={this.onNodeClicked}
              onNodeDoubleClicked={this.onNodeDoubleClicked}
              onHideRelationship={this.onHideRelationship}
              onControlClicked={this.onControlClicked}
              onHideOthers={this.onHideOthers}
              onHideNonChildren={this.onHideNonChildren}
              onHide={this.onHide}
              onHideWithChildren={this.onHideWithChildren}
              onCreateRelationship={this.onConfirmRelationshipCreate}
              onGetRelationships={this.onGetRelationships}
              onConfirmTwinDelete={this.onConfirmTwinDelete}
              onConfirmRelationshipDelete={this.onConfirmRelationshipDelete}
              onNodeMouseEnter={this.onNodeMouseEnter} />
          </div>
          <div className="gc-filter">
            <GraphViewerFilteringComponent toggleFilter={this.toggleFilter} onZoomIn={this.onZoomIn} onZoomOut={this.onZoomOut} onZoomToFit={this.onZoomToFit} onCenter={this.onCenter} />
          </div>
          {isLoading && <LoaderComponent message={`${Math.round(progress)}%`} cancel={() => this.canceled = true} />}
        </div>
        <div className="pi-wrap">
          <div className="pi-toggle">
            <Icon
              className="toggle-icon"
              iconName={propertyInspectorIsOpen ? "DoubleChevronRight" : "DoubleChevronLeft"}
              onClick={this.togglePropertyInspector}
              aria-label="Toggle property inspector"
              role="button"
              title="Toggle property inspector" />
          </div>
          <PropertyInspectorComponent />
        </div>
      </div>
    );
  }

}
