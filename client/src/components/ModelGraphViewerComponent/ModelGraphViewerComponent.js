// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IconButton } from "office-ui-fabric-react";

import { ModelGraphViewerCytoscapeComponent } from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import ModelGraphViewerFilteringComponent from "./ModelGraphViewerFilteringComponent/ModelGraphViewerFilteringComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { eventService } from "../../services/EventService";
import { ModelService } from "../../services/ModelService";

import "./ModelGraphViewerComponent.scss";


const relsKeyButtonStyles = {
  root: {
    background: "#999999",
    borderRadius: "50%",
    height: "15px",
    width: "15px",
    position: "absolute",
    top: "10px",
    right: "10px"
  },
  icon: { color: "#1e1e1e", fontSize: "10px" }
};

export class ModelGraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      filterIsOpen: false,
      showKey: true
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
        this.retrieveModels();
      }
    });
    eventService.subscribeClearData(() => {
      this.cyRef.current.clearNodes();
      this.setState({ isLoading: false });
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

  toggleShowKey = () => {
    const { showKey } = this.state;
    this.setState({ showKey: !showKey });
  }

  render() {
    const { isLoading, progress, filterIsOpen, showKey } = this.state;
    return (
      <div className={`model-graph gc-grid ${filterIsOpen ? "open" : "closed"}`}>
        <div className="gc-wrap">
          <ModelGraphViewerCytoscapeComponent
            ref={this.cyRef} />
          {showKey && <div className="relationship-key">
            <div className="rels-wrap">
              <IconButton
                iconProps={{ iconName: "ChromeClose"}}
                styles={relsKeyButtonStyles}
                onClick={this.toggleShowKey} />
              <div className="rel-key"><span className="line relationship" />Relationship</div>
              <div className="rel-key"><span className="line extends" />Inheritance</div>
              <div className="rel-key"><span className="line component" />Component</div>
            </div>
          </div>}
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
