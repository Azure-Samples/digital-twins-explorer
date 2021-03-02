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
import { REL_TYPE_OUTGOING, DETAIL_MIN_WIDTH } from "../../services/Constants";
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
      overlayResults: false,
      overlayItems: {},
      filterIsOpen: false,
      propertyInspectorIsOpen: true,
      canShowAllRelationships: false,
      propInspectorDetailWidth: DETAIL_MIN_WIDTH,
      highlightingTerms: [],
      filteringTerms: []
    };
    this.view = React.createRef();
    this.create = React.createRef();
    this.delete = React.createRef();
    this.deleteRel = React.createRef();
    this.settings = React.createRef();
    this.cyRef = React.createRef();
    this.commandRef = React.createRef();
    this.canceled = false;
    this.modelService = new ModelService();
    this.resizeStartX = 0;
    this.resizeEndX = 0;
    this.allNodes = [];
    this.relationships = [];
  }

  componentDidMount() {
    eventService.subscribeQuery(query => this.getData(query));
    eventService.subscribeOverlayQueryResults(overlayResults => {
      this.resetFiltering();
      if (this.state.overlayResults && !overlayResults) {
        this.disableOverlay();
        this.cyRef.current.clearOverlay();
      }
      this.setState({ overlayResults });
    });
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
    this.allNodes = [];
    if (this.cyRef.current) {
      this.cyRef.current.clearTwins();
    }
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
    const { isLoading, selectedNode, overlayResults } = this.state;
    if (!query || isLoading) {
      return;
    }

    this.resetFiltering();

    this.setState({ query });
    this.canceled = false;

    try {
      if (this.cyRef.current) {
        this.cyRef.current.clearSelection();
      }
      this.allNodes = await this.getTwinsData(query, overlayResults);
      await this.getRelationshipsData(this.allNodes, 30, false, !overlayResults, REL_TYPE_OUTGOING);

      if (selectedNode) {
        const selected = this.allNodes.find(t => t.$dtId === selectedNode.id);
        if (selected) {
          eventService.publishSelection({ selection: selected, selectionType: "twin" });
        } else {
          eventService.publishSelection();
        }
      } else if (overlayResults) {
        const { overlayItems: { twins, relationships } } = this.state;
        this.cyRef.current.selectNodes(twins);
        this.cyRef.current.selectEdges(relationships);
      }
    } catch (exc) {
      if (exc.errorCode !== "user_cancelled") {
        exc.customMessage = "Error fetching data for graph";
        eventService.publishError(exc);
      }
    }

    this.setState({ isLoading: false, progress: 0 });
  }

  async getTwinsData(query, overlayResults = false) {
    const allTwins = [];
    let extraTwins = [];
    const existingTwins = this.cyRef.current.getTwins();
    this.updateProgress(5);

    if (overlayResults) {
      await apiService.queryOverlay(query, async data => {
        extraTwins = data.twins.filter(twin => !existingTwins.some(et => et === twin.$dtId));
        this.cyRef.current.addTwins(extraTwins);
        await this.cyRef.current.doLayout();
        data.twins.forEach(x => allTwins.push({ ...x, selected: true }));
        this.setState({ overlayItems: { ...data, twins: data.twins.map(t => t.$dtId) }});
        this.updateProgress();
      });
    } else {
      await apiService.queryTwinsPaged(query, async twins => {
        await this.cyRef.current.clearTwins();
        this.cyRef.current.addTwins(twins);
        await this.cyRef.current.doLayout();
        twins.forEach(x => allTwins.push(x));
        this.updateProgress();
      });
    }
    this.updateProgress(25);

    if (overlayResults && extraTwins.length > 0) {
      extraTwins.forEach(t => allTwins.push(t));
    } else {
      this.cyRef.current.removeTwins(extraTwins);
    }

    return allTwins;
  }

  async getRelationshipsData(twins, baseline = 0, loadTargets = false, clearExisting = false,
    relTypeLoading = REL_TYPE_OUTGOING, expansionLevel = 1) {
    this.updateProgress(baseline);

    this.relationships = [];
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
                presentRels.forEach(x => this.relationships.push(x));
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
      const removeRels = existingRels.filter(x => this.relationships.every(y => getUniqueRelationshipId(y) !== x));
      this.cyRef.current.removeRelationships(removeRels);
    }
  }

  onEdgeClicked = async e => {
    this.setState({ selectedEdge: e });
    const relationship = await apiService.getRelationship(e.source, e.relationshipId);
    eventService.publishSelection({ selection: relationship.body, selectionType: "relationship" });
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
          eventService.publishSelection({ selection: data, selectionType: "twin" });
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
    const model = await this.modelService.getModelById(modelId);
    const properties = await this.modelService.getProperties(modelId);
    const displayName = model && model.model ? model.model.displayName : model.displayName;
    const description = model && model.model ? model.model.description : model.description;
    return {
      displayName: displayName ? displayName : "",
      description: description ? description : "",
      properties,
      relationships: model ? model.relationships : []
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

  disableOverlay = () => {
    this.setState({ overlayResults: false, overlayItems: {} });
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

  handleMouseMove = e => {
    this.resizeEndX = this.resizeStartX - e.screenX;
    if (this.resizeEndX >= DETAIL_MIN_WIDTH) {
      this.setState({
        propInspectorDetailWidth: DETAIL_MIN_WIDTH + ((this.resizeEndX * 100) / window.innerWidth)
      });
    }
  };

  handleMouseUp = e => {
    e.preventDefault();
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  };

  handleMouseDown = e => {
    e.preventDefault();
    if (this.resizeStartX === 0) {
      this.resizeStartX = e.screenX;
    }
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
  };


  onUpdateFilteringTerm = term => {
    const { filteringTerms } = this.state;
    filteringTerms[filteringTerms.map(t => t.text).indexOf(term.text)] = term;
    this.setState({ filteringTerms }, () => {
      this.filterNodes();
    });
  }

  onUpdateHighlightingTerm = term => {
    const { highlightingTerms } = this.state;
    highlightingTerms[highlightingTerms.map(t => t.text).indexOf(term.text)] = term;
    this.setState({ highlightingTerms }, () => {
      this.highlightNodes();
    });
  }

  onAddFilteringTerm = term => {
    const { filteringTerms } = this.state;
    filteringTerms.push(term);
    this.setState({ filteringTerms }, () => {
      this.filterNodes();
    });
  }

  onRemoveFilteringTerm = term => {
    const { filteringTerms } = this.state;
    filteringTerms.splice(filteringTerms.map(t => t.text).indexOf(term.text), 1);
    this.setState({ filteringTerms }, () => {
      this.filterNodes();
    });
  }

  onAddHighlightingTerm = term => {
    const { highlightingTerms } = this.state;
    highlightingTerms.push(term);
    this.setState({ highlightingTerms }, () => {
      this.highlightNodes();
    });
  }

  onRemoveHighlightingTerm = term => {
    const { highlightingTerms } = this.state;
    highlightingTerms.splice(highlightingTerms.map(t => t.text).indexOf(term.text), 1);
    this.setState({ highlightingTerms }, () => {
      this.highlightNodes();
    });
  }

  highlightNodes = () => {
    const { highlightingTerms } = this.state;
    this.cyRef.current.clearHighlighting();
    const termsHighlightingId = highlightingTerms.filter(term => term.match$dtId);
    const highlightedNodes = this.getFilteredNodes(termsHighlightingId);
    if (highlightedNodes.length > 0) {
      this.cyRef.current.highlightNodes(highlightedNodes);
    }
  }

  filterNodes = () => {
    const { filteringTerms } = this.state;
    const termsFilteringId = filteringTerms.filter(term => term.match$dtId);
    const filteredNodes = this.getFilteredNodes(termsFilteringId);
    this.cyRef.current.showAllNodes();
    if (filteredNodes.length > 0) {
      this.cyRef.current.filterNodes(filteredNodes);
    }
  }

  getFilteredNodes = termsFilteringId => {
    let outgoingRels = [];
    let filteredNodes = this.allNodes.filter(node => {
      const matchesId = termsFilteringId.some(term => {
        const matches = node.$dtId.toLowerCase().includes(term.text.toLowerCase());
        if (matches) {
          if (term.addOutgoingRelationships) {
            outgoingRels = [ ...new Set([ ...outgoingRels, ...this.getNodeOutgoingRelationships(node) ]) ];
          }
        }
        return matches;
      });
      return matchesId;
    });
    if (outgoingRels.length > 0) {
      filteredNodes = [ ...new Set([ ...filteredNodes, ...outgoingRels ]) ];
    }
    return filteredNodes;
  }

  getNodeOutgoingRelationships = node => {
    const outgoingRels = [];
    const nodeRels = this.relationships.filter(rel => rel.$sourceId === node.$dtId);
    if (nodeRels.length > 0) {
      nodeRels.forEach(rel => {
        outgoingRels.push(this.allNodes.find(n => n.$dtId === rel.$targetId));
      });
    }
    return outgoingRels;
  }

  renderCommandBar = () => {
    const {
      selectedNode,
      selectedNodes,
      selectedEdge,
      query,
      layout,
      hideMode,
      canShowAll,
      canShowAllRelationships
    } = this.state;
    return (
      <>
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
      </>
    );
  }

  resetFiltering = () => {
    this.cyRef.current.showAllNodes();
    this.cyRef.current.clearHighlighting();
    this.setState({ highlightingTerms: [], filteringTerms: [] });
  }

  render() {
    const {
      isLoading,
      progress,
      filterIsOpen,
      propertyInspectorIsOpen,
      overlayResults,
      overlayItems,
      propInspectorDetailWidth,
      highlightingTerms,
      filteringTerms
    } = this.state;
    return (
      <div className={`gvc-wrap ${propertyInspectorIsOpen ? "pi-open" : "pi-closed"}`}>
        <div className={`gc-grid ${filterIsOpen ? "open" : "closed"}`}>
          <div className="gc-toolbar">
            {this.renderCommandBar()}
          </div>
          <div className="gc-wrap">
            <GraphViewerCytoscapeComponent ref={this.cyRef}
              overlayResults={overlayResults}
              overlayItems={overlayItems}
              disableOverlay={this.disableOverlay}
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
              isHighlighting={highlightingTerms && highlightingTerms.length > 0}
              highlightFilteredNodes={this.highlightNodes}
              onNodeMouseEnter={this.onNodeMouseEnter} />
          </div>
          <div className="gc-filter">
            <GraphViewerFilteringComponent toggleFilter={this.toggleFilter} onZoomIn={this.onZoomIn} onZoomOut={this.onZoomOut} onZoomToFit={this.onZoomToFit} onCenter={this.onCenter}
              onAddHighlightingTerm={this.onAddHighlightingTerm}
              onRemoveHighlightingTerm={this.onRemoveHighlightingTerm}
              onAddFilteringTerm={this.onAddFilteringTerm}
              onRemoveFilteringTerm={this.onRemoveFilteringTerm}
              onUpdateFilteringTerm={this.onUpdateFilteringTerm}
              onUpdateHighlightingTerm={this.onUpdateHighlightingTerm}
              resetFiltering={this.resetFiltering}
              highlightingTerms={highlightingTerms}
              filteringTerms={filteringTerms} />
          </div>
          {isLoading && <LoaderComponent message={`${Math.round(progress)}%`} cancel={() => this.canceled = true} />}
        </div>
        <div className="pi-wrap" style={{width: propertyInspectorIsOpen ? `${propInspectorDetailWidth}%` : 0}}>
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
          {propertyInspectorIsOpen && (
            <div
              className="dragable"
              onMouseDown={this.handleMouseDown} />
          )}
        </div>
      </div>
    );
  }

}
