import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";

import { GraphViewerRelationshipCreateComponent } from "../GraphViewerRelationshipCreateComponent/GraphViewerRelationshipCreateComponent";
import { GraphViewerRelationshipViewerComponent } from "../GraphViewerRelationshipViewerComponent/GraphViewerRelationshipViewerComponent";
import { GraphViewerTwinDeleteComponent } from "../GraphViewerTwinDeleteComponent/GraphViewerTwinDeleteComponent";
import { eventService } from "../../../services/EventService";

import "./GraphViewerCommandBarComponent.scss";

export class GraphViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
    this.view = React.createRef();
    this.create = React.createRef();
    this.delete = React.createRef();
    this.importModelRef = React.createRef();
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
      key: "Get Relationship",
      text: "Get Relationship",
      ariaLabel: "get relationship",
      iconProps: { iconName: "Relationship" },
      onClick: () => this.view.current.open(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "Add Relationship",
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
    this.farItems[0].disabled = this.farItems[1].disabled = !selectedNode;
    this.farItems[2].disabled = !selectedNodes || selectedNodes.length !== 2;
    this.farItems[3].disabled = this.farItems[5].disabled = !query;
    this.farItems[5].subMenuProps.items = this.props.layouts.map(x => ({
      key: x,
      text: x,
      ariaLabel: x.toLowerCase(),
      iconProps: { iconName: this.props.layout === x ? "CheckMark" : "" },
      onClick: () => this.props.onLayoutChanged(x)
    }));

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
