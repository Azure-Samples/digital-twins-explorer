// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Toggle } from "office-ui-fabric-react";

import { ModelGraphViewerCytoscapeComponent } from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import ModelGraphViewerFilteringComponent from "./ModelGraphViewerFilteringComponent/ModelGraphViewerFilteringComponent";
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
      list = await new ModelService().getAllModels();
    } catch (exc) {
      exc.customMessage = "Error fetching models";
      eventService.publishError(exc);
    }
    const nodes = list.map(i => ({
      id: i.id,
      label: i.displayName
    }));
    const relationships = list.flatMap(m =>
      m.relationships.map(r => ({
        sourceId: m.id,
        targetId: r.target,
        relationshipName: r.name,
        relationshipId: r.name
      }))
    );
    const componentRelationships = list.flatMap(m =>
      m.components.map(c => ({
        sourceId: m.id,
        targetId: c.schema,
        relationshipName: c.name,
        relationshipId: c.name
      }))
    );
    const extendRelationships = list.flatMap(m =>
      m.bases.map(b => ({
        sourceId: m.id,
        targetId: b,
        relationshipName: "Extends",
        relationshipId: "extends"
      }))
    );
    this.cyRef.current.addNodes(nodes);
    this.cyRef.current.addRelationships(relationships, "related");
    this.cyRef.current.addRelationships(componentRelationships, "component");
    this.cyRef.current.addRelationships(extendRelationships, "extends");
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

  onRelationshipsToggleChange = () => {
    const { showRelationships } = this.state;
    if (showRelationships) {
      this.cyRef.current.hideRelationships();
    } else {
      this.cyRef.current.showRelationships();
    }
    this.setState({ showRelationships: !showRelationships });
  }

  onInheritancesToggleChange = () => {
    const { showInheritances } = this.state;
    if (showInheritances) {
      this.cyRef.current.hideInheritances();
    } else {
      this.cyRef.current.showInheritances();
    }
    this.setState({ showInheritances: !showInheritances });
  }

  onComponentsToggleChange = () => {
    const { showComponents } = this.state;
    if (showComponents) {
      this.cyRef.current.hideComponents();
    } else {
      this.cyRef.current.showComponents();
    }
    this.setState({ showComponents: !showComponents });
  }

  render() {
    const { isLoading, progress, filterIsOpen, showRelationships, showInheritances, showComponents } = this.state;
    return (
      <div className={`model-graph gc-grid ${filterIsOpen ? "open" : "closed"}`}>
        <div className="gc-wrap">
          <ModelGraphViewerCytoscapeComponent
            ref={this.cyRef} />
          <div className="relationship-key">
            <div className="rels-wrap">
              <div className="rel-key">
                <span className="line relationship" />
                <span className="rel-title">Relationships</span>
                <Toggle id="relationships-toggle" className="rel-toggle"
                  checked={showRelationships} onChange={this.onRelationshipsToggleChange} />
              </div>
              <div className="rel-key">
                <span className="line extends" />
                <span className="rel-title">Inheritances</span>
                <Toggle id="relationships-toggle" className="rel-toggle"
                  checked={showInheritances} onChange={this.onInheritancesToggleChange} />
              </div>
              <div className="rel-key">
                <span className="line component" />
                <span className="rel-title">Components</span>
                <Toggle id="relationships-toggle" className="rel-toggle"
                  checked={showComponents} onChange={this.onComponentsToggleChange} />
              </div>
            </div>
          </div>
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
