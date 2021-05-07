// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

import { ModelGraphViewerCytoscapeComponent, ModelGraphViewerCytoscapeLayouts } from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import ModelGraphViewerFilteringComponent from "./ModelGraphViewerFilteringComponent/ModelGraphViewerFilteringComponent";
import { ModelGraphViewerRelationshipsToggle } from "./ModelGraphViewerRelationshipsToggle/ModelGraphViewerRelationshipsToggle";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { eventService } from "../../services/EventService";
import { ModelService } from "../../services/ModelService";

import "./ModelGraphViewerComponent.scss";
import { ModelGraphViewerModelDetailComponent } from "./ModelGraphViewerModelDetailComponent/ModelGraphViewerModelDetailComponent";
import { Icon } from "office-ui-fabric-react";
import { DETAIL_MIN_WIDTH } from "../../services/Constants";
import { ModelGraphViewerCommandBarComponent } from "./ModelGraphViewerCommandBarComponent/ModelGraphViewerCommandBarComponent";

export class ModelGraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      filterIsOpen: false,
      modelDetailIsOpen: false,
      showRelationships: true,
      showInheritances: true,
      showComponents: true,
      highlightingTerms: [],
      filteringTerms: [],
      modelDetailWidth: DETAIL_MIN_WIDTH,
      layout: "d3Force",
      selectedModel: null
    };
    this.cyRef = React.createRef();
    this.commandRef = React.createRef();
    this.modelDetail = React.createRef();
    this.props.glContainer.on("show", this.initialize);
    this.isInitialized = false;
    this.modelService = new ModelService();
    this.resizeStartX = 0;
    this.resizeEndX = 0;
  }

  initialize = async () => {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    await this.retrieveModels();
  }

  componentDidMount() {
    eventService.subscribeModelIconUpdate(modelId => this.cyRef.current.updateModelIcon(modelId));
    eventService.subscribeDeleteModel(this.removeModel);
    eventService.subscribeCreateModel(this.addModels);
    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        this.modelService = new ModelService();
        this.cyRef.current.clearNodes();
        this.setState({ isLoading: false });
        this.retrieveModels();
      }
    });
    eventService.subscribeClearModelsData(() => {
      this.modelService = new ModelService();
      this.cyRef.current.clearNodes();
      this.setState({ isLoading: false });
    });
    eventService.subscribeModelsUpdate(() => {
      this.modelService = new ModelService();
      this.cyRef.current.clearNodes();
      this.setState({ isLoading: false });
      this.retrieveModels();
    });
    eventService.subscribeSelectModel(item => {
      this.setState({ selectedModel: item }, () => {
        this.highlightNodes();
      });
    });
  }

  updateProgress(newProgress) {
    const { progress } = this.state;
    if (newProgress >= 0 && newProgress > progress) {
      this.setState({ isLoading: newProgress < 100, progress: newProgress >= 100 ? 0 : newProgress });
    }
  }

  async retrieveModels() {
    const { isLoading } = this.state;
    if (isLoading) {
      return;
    }

    this.updateProgress(0);

    if (this.cyRef.current) {
      let list = [];
      try {
        list = await this.modelService.getAllModels();
      } catch (exc) {
        exc.customMessage = "Error fetching models";
        eventService.publishError(exc);
      }
      this.allNodes = this.getNodes(list);
      this.componentRelationships = this.getComponentRelationships(list);
      this.extendRelationships = this.getExtendRelationships(list);
      this.relationships = this.getRelationships(list);
      this.cyRef.current.addNodes(this.allNodes);
      this.cyRef.current.addRelationships(this.relationships, "related");
      this.cyRef.current.addRelationships(this.componentRelationships, "component");
      this.cyRef.current.addRelationships(this.extendRelationships, "extends");
      await this.cyRef.current.doLayout(this.progressCallback);
    }

    this.updateProgress(100);
  }

  addModels = async models => {
    if (this.isInitialized) {
      this.updateProgress(0);
      await this.modelService.addModels(models);

      const mapped = await this.modelService.getModels(models.map(m => m["@id"]));
      const modelNodes = this.getNodes(mapped);
      const componentRelationships = this.getComponentRelationships(mapped);
      const extendRelationships = this.getExtendRelationships(mapped);
      const relationships = this.getRelationships(mapped);

      this.allNodes.push(modelNodes);
      this.componentRelationships.push(componentRelationships);
      this.extendRelationships.push(extendRelationships);
      this.relationships.push(relationships);

      this.cyRef.current.addNodes(modelNodes);
      this.cyRef.current.addRelationships(relationships, "related");
      this.cyRef.current.addRelationships(componentRelationships, "component");
      this.cyRef.current.addRelationships(extendRelationships, "extends");
      await this.cyRef.current.doLayout(this.progressCallback);
      this.setState({ isLoading: false });
      this.updateProgress(100);
    }
  }

  removeModel = id => {
    if (id && this.isInitialized) {
      this.modelService.removeModel(id);
      this.cyRef.current.removeNodes([ id ]);
    }
  }

  getNodes = list =>
    list.map(i => ({
      id: i.id,
      label: i.displayName ? i.displayName : i.id
    }));

  getComponentRelationships = list =>
    list.flatMap(m =>
      m.components.map(c => ({
        sourceId: m.id,
        targetId: c.schema,
        relationshipName: c.name,
        relationshipId: c.name
      }))
    );

  getExtendRelationships = list =>
    list.flatMap(m =>
      m.bases.map(b => ({
        sourceId: m.id,
        targetId: b,
        relationshipName: "Extends",
        relationshipId: "extends"
      }))
    );

  getRelationships = list =>
    list.flatMap(m =>
      m.relationships
        .filter(r => {
          let parentHasSameRelationship = false;
          if (m.bases && m.bases.length > 0) {
            m.bases.forEach(base => {
              const baseModel = list.find(i => i.id === base);
              if (baseModel) {
                const hasSameRel = baseModel.relationships.some(br => br.name === r.name);
                if (hasSameRel) {
                  parentHasSameRelationship = true;
                }
              }
            });
          }
          return !parentHasSameRelationship;
        })
        .map(r => ({
          sourceId: m.id,
          targetId: r.target,
          relationshipName: r.name,
          relationshipId: r.name
        }))
    );

  toggleFilter = () => {
    const { filterIsOpen } = this.state;
    this.setState({ filterIsOpen: !filterIsOpen });
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

  progressCallback = progress => {
    this.updateProgress(progress * 100);
  }

  onRelationshipsToggleChange = async () => {
    const { showRelationships } = this.state;
    if (!this.relationships) {
      return;
    }
    this.updateProgress(0);
    if (showRelationships) {
      this.cyRef.current.removeRelationships(this.relationships);
      await this.cyRef.current.doLayout(this.progressCallback);
    } else {
      this.cyRef.current.addRelationships(this.relationships, "related");
      await this.cyRef.current.doLayout(this.progressCallback);
    }
    this.setState({ showRelationships: !showRelationships, isLoading: false });
    this.updateProgress(100);
  }

  onInheritancesToggleChange = async () => {
    const { showInheritances } = this.state;
    if (!this.extendRelationships) {
      return;
    }
    this.updateProgress(0);
    if (showInheritances) {
      this.cyRef.current.removeRelationships(this.extendRelationships);
      await this.cyRef.current.doLayout(this.progressCallback);
    } else {
      this.cyRef.current.addRelationships(this.extendRelationships, "extends");
      await this.cyRef.current.doLayout(this.progressCallback);
    }
    this.setState({ showInheritances: !showInheritances, isLoading: false });
    this.updateProgress(100);
  }

  onComponentsToggleChange = async () => {
    const { showComponents } = this.state;
    if (!this.componentRelationships) {
      return;
    }
    this.updateProgress(0);
    if (showComponents) {
      this.cyRef.current.removeRelationships(this.componentRelationships);
      await this.cyRef.current.doLayout(this.progressCallback);
    } else {
      this.cyRef.current.addRelationships(this.componentRelationships, "component");
      await this.cyRef.current.doLayout(this.progressCallback);
    }
    this.setState({ showComponents: !showComponents, isLoading: false });
    this.updateProgress(100);
  }

  onNodeMouseEnter = async modelId => {
    const properties = await this.modelService.getProperties(modelId);
    const telemetries = await this.modelService.getTelemetries(modelId);
    return {
      properties,
      telemetries
    };
  }

  onEdgeMouseEnter = async (source, relationshipId) => {
    const model = await this.modelService.getModel(source);

    const componentEdge = this.componentRelationships.find(cr => cr.sourceId === source);
    if (componentEdge) {
      return {
        name: model.components[0].displayName,
        componentModel: model.components[0].schema
      };
    }

    const inheritanceEdge = this.extendRelationships.find(er => er.sourceId === source);
    if (inheritanceEdge) {
      return {
        baseModel: model.bases[0]
      };
    }

    return model.relationships.find(r => r.name === relationshipId);
  }

  onNodeUnhover = () => {
    const activePopper = document.querySelector("#cy-popper");
    if (activePopper) {
      activePopper.parentNode.removeChild(activePopper);
    }
  }

  onNodeClicked = modelId => {
    this.modelDetail.current.loadModel(modelId);
    eventService.publishModelSelectionUpdatedInGraph(modelId);
    const { highlightingTerms } = this.state;
    if (highlightingTerms.length > 0) {
      const newTerms = highlightingTerms.map(t => ({ ...t, isActive: false }));
      this.setState({ highlightingTerms: newTerms });
    }
  }

  onControlClicked = () => {
    this.modelDetail.current.clear();
    eventService.publishModelSelectionUpdatedInGraph();
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

  getNodeSuperTypes = node => {
    const superTypes = [];
    const nodeRels = this.extendRelationships.filter(rel => rel.sourceId === node.id);
    if (nodeRels.length > 0) {
      nodeRels.forEach(rel => {
        superTypes.push(this.allNodes.find(n => n.id === rel.targetId));
      });
    }
    return superTypes;
  }

  getNodeSubTypes = node => {
    const subTypes = [];
    const nodeRels = this.extendRelationships.filter(rel => rel.targetId === node.id);
    if (nodeRels.length > 0) {
      nodeRels.forEach(rel => {
        subTypes.push(this.allNodes.find(n => n.id === rel.sourceId));
      });
    }
    return subTypes;
  }

  getNodeOutgoingRelationships = node => {
    const outgoingRels = [];
    const nodeRels = this.relationships.filter(rel => rel.sourceId === node.id);
    if (nodeRels.length > 0) {
      nodeRels.forEach(rel => {
        const relNode = this.allNodes.find(n => n.id === rel.targetId);
        if (relNode) {
          outgoingRels.push(this.allNodes.find(n => n.id === rel.targetId));
        }
      });
    }
    return outgoingRels;
  }

  highlightNodes = () => {
    const { highlightingTerms, selectedModel } = this.state;
    this.cyRef.current.clearHighlighting();
    const activeTerms = highlightingTerms.filter(term => term.isActive);
    const termsHighlightingId = activeTerms.filter(term => term.matchDtmi);
    const termsHighlightingDisplayName = activeTerms.filter(term => term.matchDisplayName);
    const selectedModelKey = selectedModel ? selectedModel.key : null;
    const highlightedNodes = this.getFilteredNodes(termsHighlightingId, termsHighlightingDisplayName, selectedModelKey);
    const highlight = termsHighlightingId.length > 0 || termsHighlightingDisplayName.length > 0 || selectedModelKey;
    this.cyRef.current.highlightNodes(highlightedNodes, highlight);
  }

  filterNodes = () => {
    const { filteringTerms } = this.state;
    const activeTerms = filteringTerms.filter(term => term.isActive);
    const termsFilteringId = activeTerms.filter(term => term.matchDtmi);
    const termsFilteringDisplayName = activeTerms.filter(term => term.matchDisplayName);
    const filteredNodes = this.getFilteredNodes(termsFilteringId, termsFilteringDisplayName);
    if (this.cyRef.current) {
      this.cyRef.current.showAllNodes();
      this.cyRef.current.filterNodes(filteredNodes);
    }
  }

  getFilteredNodes = (termsFilteringId, termsFilteringDisplayName, selectedModelKey) => {
    if (!this.allNodes) {
      eventService.publishModelSelectionUpdatedInGraph();
      return [];
    }

    let superTypes = [];
    let subTypes = [];
    let outgoingRels = [];
    let filteredNodes = this.allNodes.filter(node => {
      if (termsFilteringId.length === 0 && termsFilteringDisplayName.length === 0 && !selectedModelKey) {
        return true;
      }
      const matchesId = termsFilteringId.some(term => {
        const matches = node.id.toLowerCase().includes(term.text.toLowerCase());
        if (matches) {
          if (term.addSuperTypes) {
            superTypes = [ ...new Set([ ...superTypes, ...this.getNodeSuperTypes(node) ]) ];
          }
          if (term.addSubTypes) {
            subTypes = [ ...new Set([ ...subTypes, ...this.getNodeSubTypes(node) ]) ];
          }
          if (term.addOutgoingRelationships) {
            outgoingRels = [ ...new Set([ ...outgoingRels, ...this.getNodeOutgoingRelationships(node) ]) ];
          }
        }
        return matches;
      });
      const matchesDisplayName = termsFilteringDisplayName.some(term => {
        const matches = node.label.toLowerCase().includes(term.text.toLowerCase());
        if (matches) {
          if (term.addSuperTypes) {
            superTypes = [ ...new Set([ ...superTypes, ...this.getNodeSuperTypes(node) ]) ];
          }
          if (term.addSubTypes) {
            subTypes = [ ...new Set([ ...subTypes, ...this.getNodeSubTypes(node) ]) ];
          }
          if (term.addOutgoingRelationships) {
            outgoingRels = [ ...new Set([ ...outgoingRels, ...this.getNodeOutgoingRelationships(node) ]) ];
          }
        }
        return matches;
      });
      const matchesSelectedNode = selectedModelKey && node.id && node.id.toLowerCase() === selectedModelKey.toLowerCase();
      return matchesId || matchesDisplayName || matchesSelectedNode;
    });
    if (superTypes.length > 0) {
      filteredNodes = [ ...new Set([ ...filteredNodes, ...superTypes ]) ];
    }
    if (subTypes.length > 0) {
      filteredNodes = [ ...new Set([ ...filteredNodes, ...subTypes ]) ];
    }
    if (outgoingRels.length > 0) {
      filteredNodes = [ ...new Set([ ...filteredNodes, ...outgoingRels ]) ];
    }
    return filteredNodes;
  }

  onSwitchFilters = e => {
    if (e.key.includes("filter")) {
      if (this.cyRef.current) {
        this.cyRef.current.clearHighlighting();
      }
      this.filterNodes();
    } else if (e.key.includes("highlight")) {
      if (this.cyRef.current) {
        this.cyRef.current.showAllNodes();
      }
    }
    this.highlightNodes();
  }

  toggleModelDetail = () => {
    const { modelDetailIsOpen } = this.state;
    this.setState({ modelDetailIsOpen: !modelDetailIsOpen });
  }

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

  handleMouseMove = e => {
    this.resizeEndX = this.resizeStartX - e.screenX;
    if (this.resizeEndX >= DETAIL_MIN_WIDTH) {
      this.setState({
        modelDetailWidth: DETAIL_MIN_WIDTH + ((this.resizeEndX * 100) / window.innerWidth)
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

  onLayoutChanged = async layout => {
    this.setState({ layout });
    this.cyRef.current.setLayout(layout);
    this.updateProgress(0);
    await this.cyRef.current.doLayout(this.progressCallback);
    this.updateProgress(100);
  }

  render() {
    const { isLoading, progress, filterIsOpen, showRelationships, showInheritances, showComponents, highlightingTerms, modelDetailIsOpen, modelDetailWidth, filteringTerms, layout } = this.state;
    return (
      <div className={`mgv-wrap ${modelDetailIsOpen ? "md-open" : "md-closed"}`}>
        <div className={`model-graph gc-grid ${filterIsOpen ? "open" : "closed"}`}>
          <div className="gc-wrap">
            <div className="gc-toolbar">
              <ModelGraphViewerCommandBarComponent
                className="gc-commandbar" buttonClass="gc-toolbarButtons"
                layouts={Object.keys(ModelGraphViewerCytoscapeLayouts)} layout={layout}
                onLayoutChanged={this.onLayoutChanged} />
            </div>
            <ModelGraphViewerCytoscapeComponent
              onNodeClicked={this.onNodeClicked}
              layout={layout}
              onControlClicked={this.onControlClicked}
              onNodeMouseEnter={this.onNodeMouseEnter}
              onEdgeMouseEnter={this.onEdgeMouseEnter}
              isHighlighting={highlightingTerms && highlightingTerms.length > 0}
              highlightFilteredNodes={this.highlightFilteredNodes}
              ref={this.cyRef} />
            <ModelGraphViewerRelationshipsToggle
              onRelationshipsToggleChange={this.onRelationshipsToggleChange}
              onInheritancesToggleChange={this.onInheritancesToggleChange}
              onComponentsToggleChange={this.onComponentsToggleChange}
              showRelationships={showRelationships}
              showInheritances={showInheritances}
              showComponents={showComponents} />
          </div>
          <div className="gc-filter">
            <ModelGraphViewerFilteringComponent
              toggleFilter={this.toggleFilter}
              onZoomIn={this.onZoomIn}
              onZoomOut={this.onZoomOut}
              onZoomToFit={this.onZoomToFit}
              onAddHighlightingTerm={this.onAddHighlightingTerm}
              onRemoveHighlightingTerm={this.onRemoveHighlightingTerm}
              onAddFilteringTerm={this.onAddFilteringTerm}
              onRemoveFilteringTerm={this.onRemoveFilteringTerm}
              onUpdateFilteringTerm={this.onUpdateFilteringTerm}
              onUpdateHighlightingTerm={this.onUpdateHighlightingTerm}
              highlightingTerms={highlightingTerms}
              filteringTerms={filteringTerms}
              onSwitchFilters={this.onSwitchFilters} />
          </div>
          {isLoading && (
            <LoaderComponent
              message={`${Math.round(progress)}%`} />
          )}
        </div>
        <div className="model-detail" style={{width: modelDetailIsOpen ? `${modelDetailWidth}%` : 0}}>
          <div className="detail-toggle" onClick={this.toggleModelDetail}>
            <Icon
              className="toggle-icon"
              iconName={modelDetailIsOpen ? "DoubleChevronRight" : "DoubleChevronLeft"}
              aria-label="Toggle model details"
              role="button"
              title="Toggle model details" />
          </div>
          <ModelGraphViewerModelDetailComponent ref={this.modelDetail} />
          {modelDetailIsOpen && (
            <div
              className="dragable"
              onMouseDown={this.handleMouseDown} />
          )}
        </div>
      </div>
    );
  }

}
