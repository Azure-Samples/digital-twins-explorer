// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import ModelViewerDeleteAllModelsComponent from "../ModelViewerDeleteAllModelsComponent/ModelViewerDeleteAllModelsComponent";

export class ModelViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
    this.delete = React.createRef();
  }

  farItems = [
    {
      key: "downloadModels",
      text: "Download Models",
      iconProps: { iconName: "CloudDownload" },
      onClick: () => this.props.onDownloadModelsClicked(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "uploadModel",
      text: "Upload a Model",
      iconProps: { iconName: "CloudUpload" },
      onClick: () => this.props.onUploadModelClicked(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "deleteModels",
      text: "Delete All Models",
      ariaLabel: "delete all models",
      iconProps: { iconName: "Delete" },
      onClick: () => this.delete.current.open(),
      iconOnly: true,
      className: this.buttonClass
    }
  ]

  render() {
    return (
      <div>
        <CommandBar
          items={this.items}
          farItems={this.farItems}
          ariaLabel="Use left and right arrow keys to navigate between commands" />
        <ModelViewerDeleteAllModelsComponent ref={this.delete} />
      </div>
    );
  }

}
