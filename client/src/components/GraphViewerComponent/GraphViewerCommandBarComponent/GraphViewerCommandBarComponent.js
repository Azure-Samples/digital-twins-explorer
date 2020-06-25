// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, TextField, Icon } from "office-ui-fabric-react";

import { GraphViewerRelationshipCreateComponent } from "../GraphViewerRelationshipCreateComponent/GraphViewerRelationshipCreateComponent";
import { GraphViewerRelationshipViewerComponent } from "../GraphViewerRelationshipViewerComponent/GraphViewerRelationshipViewerComponent";
import { GraphViewerTwinDeleteComponent } from "../GraphViewerTwinDeleteComponent/GraphViewerTwinDeleteComponent";
import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";
import { REL_TYPE_OUTGOING, REL_TYPE_INCOMING, REL_TYPE_ALL } from "../../../services/Constants";

import "./GraphViewerCommandBarComponent.scss";

export class GraphViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
    this.view = React.createRef();
    this.create = React.createRef();
    this.delete = React.createRef();
    this.importModelRef = React.createRef();
    this.settings = React.createRef();
    this.state = {
      relTypeLoading: settingsService.relTypeLoading,
      relExpansionLevel: settingsService.relExpansionLevel
    };
  }

  farItems = [
    {
      key: "deleteTwin",
      text: "Delete Selected Twins",
      ariaLabel: "delete selected twins",
      iconProps: { iconName: "Delete" },
      onClick: () => this.delete.current.open(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "getRelationship",
      text: "Get Relationship",
      ariaLabel: "get relationship",
      iconProps: { iconName: "Relationship" },
      onClick: () => this.view.current.open(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "addRelationship",
      text: "Add Relationship",
      ariaLabel: "add relationship",
      iconProps: { iconName: "AddLink" },
      onClick: () => this.create.current.open(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "exportGraph",
      text: "Export Graph",
      iconProps: { iconName: "CloudDownload" },
      onClick: () => this.onExportGraphClicked(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "importGraph",
      text: "Import Graph",
      iconProps: { iconName: "CloudUpload" },
      onClick: () => this.importModelRef.current.click(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "expansionLevel",
      text: "Expansion Level",
      ariaLabel: "Select number of layers to expand",
      iconProps: { iconName: "Org" },
      className: this.buttonClass,
      iconOnly: true,
      commandBarButtonAs: () => this.renderRelationshipExpansionItem()
    },
    {
      key: "expansionMode",
      text: "Expansion Mode",
      ariaLabel: "select expansion mode",
      iconOnly: true,
      iconProps: { iconName: "ModelingView" },
      className: `${this.buttonClass} command-bar-dropdown`,
      split: true,
      subMenuProps: {
        items: [
          {
            key: REL_TYPE_INCOMING,
            text: "In",
            ariaLabel: "In",
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_INCOMING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_INCOMING)
          },
          {
            key: REL_TYPE_OUTGOING,
            text: "Out",
            ariaLabel: "Out",
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_OUTGOING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_OUTGOING)
          },
          {
            key: REL_TYPE_ALL,
            text: "In/Out",
            ariaLabel: "In/Out",
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_ALL ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_ALL)
          }
        ]
      }
    },
    {
      key: "relayout",
      text: "Run Layout",
      ariaLabel: "run layout",
      iconOnly: true,
      iconProps: { iconName: "ArrangeSendToBack" },
      onClick: () => this.props.onLayoutClicked(),
      className: this.buttonClass,
      split: true,
      subMenuProps: {}
    },
    {
      key: "zoomToFit",
      text: "Zoom to Fit",
      ariaLabel: "zoom to fit",
      iconOnly: true,
      iconProps: { iconName: "ZoomToFit" },
      onClick: () => this.props.onZoomToFitClicked(),
      className: this.buttonClass
    },
    {
      key: "centerGraph",
      text: "Center Graph",
      ariaLabel: "center graph",
      iconOnly: true,
      iconProps: { iconName: "FitPage" },
      onClick: () => this.props.onCenterClicked(),
      className: this.buttonClass
    }
  ]

  renderRelationshipExpansionItem = () => (
    <div className="expansion-level-option">
      <Icon iconName="Org" />
      <TextField id="relExpansionLevelField"
        className="command-bar-input configuration-input numeric-input" styles={this.getStyles} value={this.state.relExpansionLevel}
        onChange={this.onExpansionLevelChange} type="number" min="1" max="5" />
    </div>
  )

  onSelectedRelTypeChange = type => {
    settingsService.relTypeLoading = type;
    this.setState({ relTypeLoading: type });
  }

  onExpansionLevelChange = evt => {
    this.setState({ relExpansionLevel: evt.target.value });
    settingsService.relExpansionLevel = evt.target.value;
  }

  onImportGraphClicked = evt => {
    eventService.publishImport({ file: evt.target.files[0] });
    this.importModelRef.current.value = "";
  }

  onExportGraphClicked() {
    const { query } = this.props;
    eventService.publishExport({ query });
  }

  render() {
    const { selectedNode, selectedNodes, onTwinDelete, onRelationshipCreate, query, onGetCurrentNodes } = this.props;
    this.farItems.find(i => i.key === "deleteTwin").disabled = !selectedNode;
    this.farItems.find(i => i.key === "getRelationship").disabled = !selectedNodes || selectedNodes.length !== 1;
    this.farItems.find(i => i.key === "addRelationship").disabled = !selectedNodes || selectedNodes.length !== 2;
    this.farItems.find(i => i.key === "exportGraph").disabled = this.farItems.find(i => i.key === "relayout").disabled = !query;
    this.farItems.find(i => i.key === "relayout").subMenuProps.items = this.props.layouts.map(x => ({
      key: x,
      text: x,
      ariaLabel: x.toLowerCase(),
      iconProps: { iconName: this.props.layout === x ? "CheckMark" : "" },
      onClick: () => this.props.onLayoutChanged(x)
    }));
    this.farItems.find(item => item.key === "expansionMode").subMenuProps.items
      = this.farItems.find(item => item.key === "expansionMode").subMenuProps.items.map(item => {
        item.iconProps = { iconName: item.key === this.state.relTypeLoading ? "CheckMark" : "" };
        return item;
      });

    return (
      <>
        <CommandBar className="gv-commandbar"
          farItems={this.farItems}
          ariaLabel="Use left and right arrow keys to navigate between commands" />
        <input id="file-input" type="file" name="name" className="gc-fileInput" ref={this.importModelRef}
          onChange={this.onImportGraphClicked} />
        <GraphViewerRelationshipCreateComponent ref={this.create}
          selectedNode={selectedNode} selectedNodes={selectedNodes}
          onCreate={onRelationshipCreate} />
        <GraphViewerRelationshipViewerComponent selectedNode={selectedNode} ref={this.view} />
        <GraphViewerTwinDeleteComponent selectedNode={selectedNode} selectedNodes={selectedNodes} query={query} ref={this.delete}
          onDelete={onTwinDelete} onGetCurrentNodes={onGetCurrentNodes} />
      </>
    );
  }

}
