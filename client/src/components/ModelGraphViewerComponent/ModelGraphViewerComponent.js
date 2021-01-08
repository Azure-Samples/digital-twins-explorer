// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ModelGraphViewerCytoscapeComponent } from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import ModelGraphViewerFilteringComponent from "./ModelGraphViewerFilteringComponent/ModelGraphViewerFilteringComponent";
import { ModelGraphViewerRelationshipsToggle } from "./ModelGraphViewerRelationshipsToggle/ModelGraphViewerRelationshipsToggle";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { eventService } from "../../services/EventService";
import { ModelService } from "../../services/ModelService";

import "./ModelGraphViewerComponent.scss";

export class ModelGraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      filterIsOpen: false,
      showRelationships: true,
      showInheritances: true,
      showComponents: true
    };
    this.cyRef = React.createRef();
    this.commandRef = React.createRef();
    this.canceled = false;
    this.props.glContainer.on("show", this.initialize);
    this.modelService = new ModelService();
  }

  initialize = async () => {
    await this.retrieveModels();
  }

  componentDidMount() {
    eventService.subscribeModelIconUpdate(modelId => this.cyRef.current.updateModelIcon(modelId));
    eventService.subscribeDeleteModel(() => this.retrieveModels());
    eventService.subscribeCreateModel(() => this.retrieveModels());
    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        this.cyRef.current.clearNodes();
        this.setState({ isLoading: false });
        this.retrieveModels();
      }
    });
    eventService.subscribeClearData(() => {
      this.cyRef.current.clearNodes();
      this.setState({ isLoading: false });
    });
    eventService.subscribeModelsUpdate(() => {
      this.retrieveModels();
    });
  }

  async retrieveModels() {
    this.setState({ isLoading: true });

    let list = [];
    try {
      list = await this.modelService.getAllModels();
    } catch (exc) {
      exc.customMessage = "Error fetching models";
      eventService.publishError(exc);
    }
    const nodes = list.map(i => ({
      id: i.id,
      label: i.displayName ? i.displayName : i.id
    }));
    this.componentRelationships = list.flatMap(m =>
      m.components.map(c => ({
        sourceId: m.id,
        targetId: c.schema,
        relationshipName: c.name,
        relationshipId: c.name
      }))
    );
    this.extendRelationships = list.flatMap(m =>
      m.bases.map(b => ({
        sourceId: m.id,
        targetId: b,
        relationshipName: "Extends",
        relationshipId: "extends"
      }))
    );
    this.relationships = list.flatMap(m =>
      m.relationships.filter(r => {
        let parentHasSameRelationship = false;
        if (m.bases && m.bases.length > 0) {
          m.bases.forEach(base => {
            const baseModel = list.find(i => i.id === base);
            const hasSameRel = baseModel.relationships.some(br => br.name === r.name);
            if (hasSameRel) {
              parentHasSameRelationship = true;
            }
          });
        }
        return !parentHasSameRelationship;
      }).map(r => ({
        sourceId: m.id,
        targetId: r.target,
        relationshipName: r.name,
        relationshipId: r.name
      }))
    );
    this.cyRef.current.addNodes(nodes);
    this.cyRef.current.addRelationships(this.relationships, "related");
    this.cyRef.current.addRelationships(this.componentRelationships, "component");
    this.cyRef.current.addRelationships(this.extendRelationships, "extends");
    await this.cyRef.current.doLayout();
    this.setState({ isLoading: false });
  }

  onLayoutChanged = layout => {
    this.cyRef.current.setLayout(layout);
    this.cyRef.current.doLayout();
  };

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

  onRelationshipsToggleChange = async () => {
    const { showRelationships } = this.state;
    this.setState({ isLoading: true });
    if (showRelationships) {
      this.cyRef.current.removeRelationships(this.relationships);
      await this.cyRef.current.doLayout();
    } else {
      this.cyRef.current.addRelationships(this.relationships, "related");
      await this.cyRef.current.doLayout();
    }
    this.setState({ showRelationships: !showRelationships, isLoading: false });
  }

  onInheritancesToggleChange = async () => {
    const { showInheritances } = this.state;
    this.setState({ isLoading: true });
    if (showInheritances) {
      this.cyRef.current.removeRelationships(this.extendRelationships);
      await this.cyRef.current.doLayout();
    } else {
      this.cyRef.current.addRelationships(this.extendRelationships, "extends");
      await this.cyRef.current.doLayout();
    }
    this.setState({ showInheritances: !showInheritances, isLoading: false });
  }

  onComponentsToggleChange = async () => {
    const { showComponents } = this.state;
    this.setState({ isLoading: true });
    if (showComponents) {
      this.cyRef.current.removeRelationships(this.componentRelationships);
      await this.cyRef.current.doLayout();
    } else {
      this.cyRef.current.addRelationships(this.componentRelationships, "component");
      await this.cyRef.current.doLayout();
    }
    this.setState({ showComponents: !showComponents, isLoading: false });
  }

  onNodeHover = async modelId => {
    const properties = await this.modelService.getProperties(modelId);
    const telemetries = await this.modelService.getTelemetries(modelId);
    const contentDiv = this.getPopperContent(modelId, properties, telemetries);
    document.body.appendChild(contentDiv);
    this.cyRef.current.renderInfoPane(modelId, contentDiv);
  }

  onNodeUnhover = () => {
    const activePopper = document.querySelector("#cy-popper");
    if (activePopper) {
      activePopper.parentNode.removeChild(activePopper);
    }
  }

  getContents = (properties, telemetries) => {
    let definedProperties = "";
    let definedTelemetries = "";
    for (const [ key ] of Object.entries(properties)) {
      definedProperties += `<li>${key}</li>`;
    }
    telemetries.forEach(r => definedTelemetries += `<li>${r.name}</li>`);
    return { definedTelemetries, definedProperties };
  }

  getPopperContent = (modelId, properties, telemetries) => {
    const { definedProperties, definedTelemetries } = this.getContents(properties, telemetries);
    const div = document.createElement("div");
    div.setAttribute("id", "cy-popper");
    div.innerHTML = `
      <div>
        <h4>DTID:</h4>
        <p>${modelId}</p>
      </div>
      <div>
        <h4>PROPERTIES</h4>
        <ul>${definedProperties}</ul>
      </div>
      <div>
        <h4>TELEMETRY</h4>
        <ul>${definedTelemetries}</ul>
      </div>`;

    return div;
  };

  render() {
    const { isLoading, progress, filterIsOpen, showRelationships, showInheritances, showComponents } = this.state;
    return (
      <div className={`model-graph gc-grid ${filterIsOpen ? "open" : "closed"}`}>
        <div className="gc-wrap">
          <ModelGraphViewerCytoscapeComponent
            onNodeHover={this.onNodeHover}
            onNodeUnhover={this.onNodeUnhover}
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
          <ModelGraphViewerFilteringComponent toggleFilter={this.toggleFilter} onZoomIn={this.onZoomIn} onZoomOut={this.onZoomOut} onZoomToFit={this.onZoomToFit} />
        </div>
        {isLoading && (
          <LoaderComponent
            message={`${Math.round(progress)}%`}
            cancel={() => (this.canceled = true)} />
        )}
      </div>
    );
  }

}
