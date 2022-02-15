// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Icon } from "office-ui-fabric-react";

import GraphViewerCommandBarComponent from "./GraphViewerCommandBarComponent/GraphViewerCommandBarComponent";
import { GraphViewerCytoscapeComponent, GraphViewerCytoscapeLayouts } from "./GraphViewerCytoscapeComponent/GraphViewerCytoscapeComponent";
import { GraphViewerRelationshipCreateComponent } from "./GraphViewerRelationshipCreateComponent/GraphViewerRelationshipCreateComponent";
import { GraphViewerRelationshipViewerComponent } from "./GraphViewerRelationshipViewerComponent/GraphViewerRelationshipViewerComponent";
import { GraphViewerTwinDeleteComponent } from "./GraphViewerTwinDeleteComponent/GraphViewerTwinDeleteComponent";
import GraphViewerRelationshipDeleteComponent from "./GraphViewerRelationshipDeleteComponent/GraphViewerRelationshipDeleteComponent";
import PropertyInspectorComponent from "../PropertyInspectorComponent/PropertyInspectorComponent";
import GraphViewerFilteringComponent from "./GraphViewerFilteringComponent/GraphViewerFilteringComponent";
import { withTranslation } from "react-i18next";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { apiService } from "../../services/ApiService";
import { ModelService } from "../../services/ModelService";
import { eventService } from "../../services/EventService";
import { print } from "../../services/LoggingService";
import { BatchService } from "../../services/BatchService";
import { settingsService } from "../../services/SettingsService";
import { REL_TYPE_OUTGOING, DETAIL_MIN_WIDTH, PROPERTY_INSPECTOR_DEFAULT_WIDTH } from "../../services/Constants";
import { getUniqueRelationshipId } from "../../utils/utilities";

import "./GraphViewerComponent.scss";
class GraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      selectedNode: null,
      selectedNodes: null,
      selectedEdges: null,
      layout: "Klay",
      hideMode: "hide-selected",
      canShowAll: false,
      overlayResults: false,
      overlayItems: {},
      filterIsOpen: false,
      currentFilter: "filter",
      propertyInspectorIsOpen: true,
      canShowAllRelationships: false,
      propInspectorDetailWidth: PROPERTY_INSPECTOR_DEFAULT_WIDTH,
      couldNotDisplay: false,
      outputIsOpen: false,
      highlightingTerms: [],
      filteringTerms: [],
      highlightedNodes: [],
      filteredNodes: [],
      noResults: false,
      isDisplayNameAsteriskPresent: false
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
    eventService.subscribeQuery(query => {
      this.getData(query);
    });
    eventService.subscribeOverlayQueryResults(overlayResults => {
      this.resetFiltering();
      if (this.state.overlayResults && !overlayResults) {
        this.disableOverlay();
        if (this.cyRef.current) {
          this.cyRef.current.clearOverlay();
        }
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
      this.cyRef.current.updateNodeColors();
      this.cyRef.current.zoomToFit();
    });
    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        this.clearData();
      }
    });
    eventService.subscribeClearTwinsData(() => {
      this.clearData();
    });
    eventService.subscribeModelIconUpdate(modelId => this.cyRef.current.updateModelIcon(modelId));
    eventService.subscribeCreateTwin(() => {
      this.cyRef.current.unselectSelectedNodes();
    });
    eventService.subscribeOpenOptionalComponent(() => {
      this.setState({ outputIsOpen: true });
    });
    eventService.subscribeComponentClosed(component => {
      if (component === "outputComponent") {
        this.setState({ outputIsOpen: false });
      }
    });
    eventService.subscribeFocusTwin(twin => {
      this.cyRef.current.emitNodeEvent(twin.$dtId, "mouseover");
    });
    eventService.subscribeBlurTwin(twin => {
      this.cyRef.current.emitNodeEvent(twin.$dtId, "mouseout");
    });
    eventService.subscribeTwinContextMenu(twin => {
      this.cyRef.current.rightClickNode(twin.$dtId);
      this.cyRef.current.focusContextMenu();
    });
    eventService.subscribeRelationshipContextMenu(relationship => {
      this.cyRef.current.rightClickEdge(getUniqueRelationshipId(relationship));
      this.cyRef.current.focusContextMenu();
    });
    eventService.subscribeClickRelationship(relationship => {
      eventService.publishSelection({ selection: relationship, selectionType: "relationship" });
      this.cyRef.current.clickEdge(getUniqueRelationshipId(relationship));
    });
    eventService.subscribeClearGraphSelection(() => {
      this.cyRef.current.clearOverlay();
    });
    eventService.subscribeSelectTwins(twinIds => {
      this.cyRef.current.selectNodes(twinIds, true);
    });
  }

  clearData() {
    eventService.publishSelection();
    eventService.publishGraphTwins([]);
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
      const allTwins = await this.getTwinsData(query, overlayResults);
      if (allTwins.length > 0) {
        await this.getRelationshipsData(allTwins, 30, false, !overlayResults, REL_TYPE_OUTGOING);
        if (selectedNode) {
          const selected = allTwins.find(t => t.$dtId === selectedNode.id);
          if (selected) {
            eventService.publishSelection({ selection: selected, selectionType: "twin" });
          } else {
            eventService.publishSelection();
          }
        }
        if (overlayResults) {
          const { overlayItems: { twins, relationships } } = this.state;
          this.cyRef.current.selectNodes(twins);
          this.cyRef.current.selectEdges(relationships);
        } else {
          this.allNodes = allTwins;
          eventService.publishGraphTwins(this.allNodes);
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

  async getTwinsData(query, overlayResults = false) {
    const allTwins = [];
    let extraTwins = [];
    const existingTwins = this.cyRef.current ? this.cyRef.current.getTwins() : [];
    this.updateProgress(5);

    if (overlayResults) {
      await apiService.query(query, async data => {
        if (data.twins.length > 0 || data.relationships.length > 0) {
          this.setState({ couldNotDisplay: false, noResults: false });
          extraTwins = data.twins.filter(twin => !existingTwins.some(et => et === twin.$dtId));
          this.cyRef.current.addTwins(extraTwins);
          await this.cyRef.current.doLayout();
          data.twins.forEach(x => allTwins.push({ ...x, selected: true }));
          this.setState({ overlayItems: { ...data, twins: data.twins.map(t => t.$dtId) }});
          this.updateProgress();
        } else {
          this.setState({ couldNotDisplay: true });
        }
      });
    } else {
      if (this.cyRef.current) {
        this.cyRef.current.clearTwins();
      }

      await apiService.query(query, async data => {
        if (data.twins.length > 0) {
          this.setState({ couldNotDisplay: false, noResults: false, relationshipsOnly: false });
          this.cyRef.current.addTwins(data.twins);
          await this.cyRef.current.doLayout();
          data.twins.forEach(x => allTwins.push(x));
          this.updateProgress();

          if (data.other.length > 0) {
            this.setState({ couldNotDisplay: true });
          }
        } else if (data.relationships.length > 0) {
          this.setState({ couldNotDisplay: true, relationshipsOnly: true });
        } else if (data.other.length > 0) {
          this.setState({ couldNotDisplay: true, relationshipsOnly: false });
        } else {
          this.setState({ couldNotDisplay: true, noResults: true, relationshipsOnly: false });
        }
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

      const twinsChunks = this.modelService.chunkModelsList(currentTwins, 100);
      const bs = new BatchService({
        refresh: () => this.cyRef.current.doLayout(),
        update: p => this.updateProgress(baseline + (i * baselineChunk) + ((p / 100) * baselineChunk)),
        items: twinsChunks,
        action: (twinsList, resolve, reject) => {
          if (this.canceled) {
            resolve();
          }
          apiService
            .queryRelationshipsPaged(twinsList.map(twin => twin.$dtId), async rels => {
              try {
                if (this.canceled) {
                  resolve();
                }
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

                  this.allNodes = this.allNodes.concat(missingTwins);
                  this.cyRef.current.addTwins(missingTwins);
                  eventService.publishGraphTwins(this.allNodes);
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
      eventService.publishGraphRelationships(this.relationships);
    }

    if (clearExisting) {
      const removeRels = existingRels.filter(x => this.relationships.every(y => getUniqueRelationshipId(y) !== x));
      this.cyRef.current.removeRelationships(removeRels);
    }
  }

  onEdgeClicked = async (e, selectedEdges) => {
    this.setState({ selectedEdges: selectedEdges.map(edge => edge.data()) });
    const relationship = await apiService.getRelationship(e.source, e.relationshipId);
    eventService.publishSelection({ selection: relationship.body, selectionType: "relationship" });
  }

  onNodeClicked = async e => {
    this.setState({ selectedNode: e.selectedNode, selectedNodes: e.selectedNodes });
    eventService.publishSelectedTwins(e.selectedNodes);
    const { highlightingTerms } = this.state;
    if (highlightingTerms.length > 0) {
      const newTerms = highlightingTerms.map(t => ({ ...t, isActive: false }));
      this.setState({ highlightingTerms: newTerms });
    }
    if (e.selectedNodes && e.selectedNodes.length > 1) {
      eventService.publishSelection();
    } else if (e.selectedNode) {
      try {
        const data = await apiService.getTwinById(e.selectedNode.id);

        // Get latest
        const { selectedNode } = this.state;
        if (data && selectedNode.id === e.selectedNode.id) {
          eventService.publishSelection({ selection: data, selectionType: "twin" });
        } else {
          eventService.publishSelection();
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
      this.canceled = false;
      await this.getRelationshipsData([ { $dtId: e.id } ], 10, true, false,
        settingsService.relTypeLoading, settingsService.relExpansionLevel);
    } catch (exc) {
      if (this.canceled) {
        this.setState({ selectedNode: null, selectedNodes: null, selectedEdges: null });
      }
      if (exc.errorCode !== "user_cancelled") {
        exc.customMessage = "Error fetching data for graph";
        eventService.publishError(exc);
      }
    } finally {
      this.setState({ isLoading: false, progress: 0 });
    }
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
    this.setState({ selectedNode: null, selectedNodes: null, selectedEdges: null });
    eventService.publishSelection();
    eventService.publishSelectedTwins([]);

    const { highlightingTerms, filteringTerms } = this.state;
    if (highlightingTerms.length > 0) {
      const newTerms = highlightingTerms.map(t => ({ ...t, isActive: false }));
      this.setState({ highlightingTerms: newTerms });
    }
    if (filteringTerms.length > 0) {
      const newTerms = filteringTerms.map(t => ({ ...t, isActive: false }));
      if (this.cyRef.current) {
        this.cyRef.current.showAllNodes();
      }
      this.setState({ filteringTerms: newTerms });
    }
  }

  onTwinDelete = ids => {
    if (ids) {
      this.cyRef.current.removeTwins(ids);
      this.cyRef.current.clearSelection();
    } else {
      this.cyRef.current.clearTwins();
    }
    this.setState({ selectedNode: null, selectedNodes: null });
    eventService.publishSelection();
    this.allNodes = this.allNodes.filter(n => !ids.includes(n.$dtId));
    eventService.publishGraphTwins(this.allNodes);
  }

  onHide = () => this.setState({ hideMode: "hide-selected", canShowAll: true });

  onHideOthers = () => this.setState({ hideMode: "hide-others", canShowAll: true });

  onHideNonChildren = () => this.setState({ hideMode: "hide-non-children", canShowAll: true });

  onHideWithChildren = () => this.setState({ hideMode: "hide-with-children", canShowAll: true });

  onShowAll = () => {
    if (this.cyRef.current) {
      this.cyRef.current.showAllNodes();
      this.setState({ canShowAll: false });
    }
  };

  onShowAllRelationships = () => {
    if (this.cyRef.current) {
      this.cyRef.current.showAllEdges();
      this.setState({ canShowAllRelationships: false });
    }
  };

  onHideRelationship = () => {
    this.setState({ canShowAllRelationships: true });
  }

  onRelationshipCreate = relationship => {
    if (relationship) {
      this.cyRef.current.addRelationships([ relationship ]);
      this.setState({ selectedNode: null, selectedNodes: null });
      this.cyRef.current.unselectSelectedNodes();
      this.cyRef.current.clearSelection();
    } else {
      const { selectedNodes } = this.state;
      selectedNodes.pop();
      this.setState({ selectedNode: null, selectedNodes });
    }
  }

  onRelationshipDelete = relationship => {
    if (relationship) {
      this.cyRef.current.removeRelationships([ getUniqueRelationshipId(relationship) ]);
      this.setState({ selectedEdges: null });
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
    this.setState({ overlayItems: {} });
  }

  onConfirmTwinDelete = node => {
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

  onConfirmRelationshipDelete = edge => {
    const { selectedEdges } = this.state;
    const edgeData = edge.data();
    if (selectedEdges) {
      if (selectedEdges.some(e => e.id === edgeData.id)) {
        this.deleteRel.current.open();
      } else {
        const newEdges = [ ...selectedEdges, edgeData ];
        this.setState({ selectedEdges: newEdges }, () => {
          this.deleteRel.current.open();
        });
      }
    } else {
      this.setState({ selectedEdges: [ edgeData ] }, () => {
        this.deleteRel.current.open();
      });
    }
  }

  onGetRelationships = node => {
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
    const { highlightingTerms, overlayItems, overlayResults } = this.state;
    this.cyRef.current.clearHighlighting();
    const activeTerms = highlightingTerms.filter(term => term.isActive);
    const highlightedNodes = this.getFilteredNodes(activeTerms, overlayResults);
    let highlightedNodesIds = highlightedNodes.map(n => n.$dtId);
    if (overlayResults && overlayItems.twins && overlayItems.twins.length > 0) {
      highlightedNodesIds = [ ...highlightedNodesIds, ...overlayItems.twins ];
    }
    this.cyRef.current.highlightNodes(highlightedNodesIds, activeTerms.length > 0 || overlayResults);
    this.setState({ highlightedNodes });
  }

  filterNodes = () => {
    const { filteringTerms } = this.state;
    const activeTerms = filteringTerms.filter(term => term.isActive);
    const filteredNodes = this.getFilteredNodes(activeTerms, false);
    this.setState({ filteredNodes });
    if (this.cyRef.current) {
      this.cyRef.current.showAllNodes();
      this.cyRef.current.filterNodes(filteredNodes);
      eventService.publishGraphTwins(filteredNodes);
    }
  }

  getFilteredNodes = (termsFilteringId, overlayResults) => {
    let outgoingRels = [];
    let filteredNodes = this.allNodes.filter(node => {
      if (termsFilteringId.length === 0) {
        return !overlayResults;
      }
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
      selectedEdges,
      query,
      layout,
      hideMode,
      canShowAll,
      canShowAllRelationships
    } = this.state;
    return (
      <>
        <GraphViewerCommandBarComponent className="gc-commandbar" buttonClass="gc-toolbarButtons" ref={this.commandRef}
          selectedNode={selectedNode} selectedNodes={selectedNodes} query={query}
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
          onGetCurrentNodes={() => this.cyRef.current.graphControl.nodes()}
          setSelectedDisplayNameProperty={this.props.setSelectedDisplayNameProperty}
          selectedDisplayNameProperty={this.props.selectedDisplayNameProperty}
          isDisplayNameAsteriskPresent={this.state.isDisplayNameAsteriskPresent}
          displayNameProperties={this.props.displayNameProperties} />
        <GraphViewerRelationshipCreateComponent ref={this.create}
          selectedNode={selectedNode} selectedNodes={selectedNodes}
          onCreate={this.onRelationshipCreate} />
        <GraphViewerRelationshipViewerComponent selectedNode={selectedNode} ref={this.view} />
        <GraphViewerTwinDeleteComponent selectedNode={selectedNode} selectedNodes={selectedNodes} query={query} ref={this.delete}
          onDelete={this.onTwinDelete} onGetCurrentNodes={() => this.cyRef.current.graphControl.nodes()} />
        <GraphViewerRelationshipDeleteComponent selectedEdges={selectedEdges} ref={this.deleteRel} />
      </>
    );
  }

  resetFiltering = () => {
    if (this.cyRef.current) {
      this.cyRef.current.showAllNodes();
      this.cyRef.current.clearHighlighting();
    }
    this.setState({ highlightingTerms: [], filteringTerms: [] });
  }

  onSwitchFilters = e => {
    let currentFilter = "filter";
    if (e.key.includes("filter")) {
      if (this.cyRef.current) {
        this.cyRef.current.clearHighlighting();
      }
      this.filterNodes();
    } else if (e.key.includes("highlight")) {
      if (this.cyRef.current) {
        this.cyRef.current.showAllNodes();
      }
      currentFilter = "highlight";
      this.highlightNodes();
    }
    this.setState({ currentFilter });
  }

  onSelectAllHighlighted = () => {
    const { highlightedNodes } = this.state;
    if (highlightedNodes.length > 0) {
      this.cyRef.current.selectNodes(highlightedNodes.map(node => node.$dtId));
      const newSelectedNodes = highlightedNodes.map(node => ({ id: node.$dtId, modelId: node.$metadata.$model }));
      this.setState({ selectedNode: newSelectedNodes[0], selectedNodes: newSelectedNodes });
      eventService.publishSelectedTwins(newSelectedNodes);
    }
  }

  onSelectAllFiltered = () => {
    const { filteredNodes } = this.state;
    if (filteredNodes.length > 0) {
      this.cyRef.current.selectNodes(filteredNodes.map(node => node.$dtId));
      const newSelectedNodes = filteredNodes.map(node => ({ id: node.$dtId, modelId: node.$metadata.$model }));
      this.setState({ selectedNode: newSelectedNodes[0], selectedNodes: newSelectedNodes });
      eventService.publishSelectedTwins(newSelectedNodes);
    }
  }

  deselectAll = () => {
    const { currentFilter } = this.state;
    eventService.publishSelectedTwins([]);
    this.setState({ selectedNode: null, selectedNodes: null });
    if (currentFilter === "filter") {
      this.cyRef.current.clearHighlighting();
      this.filterNodes();
    } else {
      this.highlightNodes();
    }
  }

  onClearAll = () => {
    const { currentFilter } = this.state;
    eventService.publishSelectedTwins([]);
    if (currentFilter === "filter") {
      this.setState({ selectedNode: null, selectedNodes: null, filteringTerms: [] }, () => {
        this.cyRef.current.clearHighlighting();
        this.filterNodes();
      });
    } else {
      this.setState({ selectedNode: null, selectedNodes: null, highlightingTerms: [] }, () => {
        this.highlightNodes();
      });
    }
  }

  onFocusBackToTwinViewer = () => eventService.publishFocusTwinViewer();

  render() {
    const { isLoading, progress, filterIsOpen, propertyInspectorIsOpen,
      overlayResults, overlayItems, propInspectorDetailWidth, couldNotDisplay, relationshipsOnly,
      outputIsOpen, highlightingTerms, filteringTerms, filteredNodes, highlightedNodes, noResults, selectedNodes } = this.state;
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
              onFocusBackToTwinViewer={this.onFocusBackToTwinViewer}
              onHideWithChildren={this.onHideWithChildren}
              onCreateRelationship={this.onConfirmRelationshipCreate}
              onGetRelationships={this.onGetRelationships}
              onConfirmTwinDelete={this.onConfirmTwinDelete}
              onConfirmRelationshipDelete={this.onConfirmRelationshipDelete}
              isHighlighting={highlightingTerms && highlightingTerms.length > 0}
              highlightFilteredNodes={this.highlightNodes}
              displayNameProperty={this.props.selectedDisplayNameProperty}
              setIsDisplayNameAsteriskPresent={isPresent => this.setState({ isDisplayNameAsteriskPresent: isPresent })}
              onNodeMouseEnter={this.onNodeMouseEnter} />
            {couldNotDisplay && <div className={`alert-no-display ${outputIsOpen ? "output" : ""} ${noResults ? "no-results" : ""}`}>
              <div className="alert--info">i</div>
              <div className="alert--message">
                {noResults ? <span>No results found. </span>
                  : <>
                    {relationshipsOnly ? <span>You can only render relationships if a twin is returned too. </span>
                      : <span>The query returned results that could not be displayed or overlayed. </span>}
                    {!outputIsOpen && <>
                      <span>Open the </span>
                      <a onClick={() => {
                        eventService.publishOpenOptionalComponent("output");
                        this.setState({ couldNotDisplay: false });
                      }}>Output Panel</a>
                      <span> and run the query again to see the results.</span>
                    </>}
                  </>}
              </div>
              <Icon
                className="alert--close"
                iconName="ChromeClose"
                aria-label={this.props.t("graphViewerComponent.alertCloseIcon")}
                role="button"
                onClick={() => this.setState({ couldNotDisplay: false })}
                title="Close alert" />
            </div>}
          </div>
          <div className="gc-filter">
            <GraphViewerFilteringComponent toggleFilter={this.toggleFilter} onZoomIn={this.onZoomIn} onZoomOut={this.onZoomOut} onZoomToFit={this.onZoomToFit} onCenter={this.onCenter}
              onAddHighlightingTerm={this.onAddHighlightingTerm}
              onRemoveHighlightingTerm={this.onRemoveHighlightingTerm}
              onAddFilteringTerm={this.onAddFilteringTerm}
              onRemoveFilteringTerm={this.onRemoveFilteringTerm}
              onUpdateFilteringTerm={this.onUpdateFilteringTerm}
              onUpdateHighlightingTerm={this.onUpdateHighlightingTerm}
              onSwitchFilters={this.onSwitchFilters}
              deselectAll={this.deselectAll}
              canSelectAllFilter={filteredNodes.length > 0 && (!selectedNodes || selectedNodes.length === 0)}
              canSelectAllHighlight={highlightedNodes.length > 0 && (!selectedNodes || selectedNodes.length === 0)}
              onSelectAllHighlighted={this.onSelectAllHighlighted}
              selectAllHighlightedText={this.props.t("graphViewerFilteringComponent.selectAllHighlighted")}
              onSelectAllFiltered={this.onSelectAllFiltered}
              selectAllFilteredText={this.props.t("graphViewerFilteringComponent.selectAllFiltered")}
              highlightingTerms={highlightingTerms}
              filteringTerms={filteringTerms}
              onClearAll={this.onClearAll} />
          </div>
          {isLoading && <LoaderComponent message={`${Math.round(progress)}%`} cancel={() => this.canceled = true} />}
        </div>
        <div className="pi-wrap" style={{width: propertyInspectorIsOpen ? `${propInspectorDetailWidth}%` : 0}}>
          <div className="pi-toggle" tabIndex="0" onClick={this.togglePropertyInspector}>
            <Icon
              className="toggle-icon"
              iconName={propertyInspectorIsOpen ? "DoubleChevronRight" : "DoubleChevronLeft"}
              onClick={this.togglePropertyInspector}
              aria-label={this.props.t("graphViewerComponent.toggleIcon")}
              role="button"
              title={this.props.t("graphViewerComponent.toggleIcon")} />
          </div>
          <PropertyInspectorComponent isOpen={propertyInspectorIsOpen} />
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

export default withTranslation("translation", { withRef: true })(GraphViewerComponent);
