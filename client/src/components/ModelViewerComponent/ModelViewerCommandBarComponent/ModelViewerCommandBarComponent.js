// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";
import { OatPublicUtils, Utils } from "@microsoft/iot-cardboard-js";
import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";

import ModelViewerDeleteAllModelsComponent from "../ModelViewerDeleteAllModelsComponent/ModelViewerDeleteAllModelsComponent";

class ModelViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
    this.delete = React.createRef();
  }

  downloadFilesAsZip = async () => {
    let list = [];
    try {
      list = await apiService.queryModels(false);
      const zipResult = OatPublicUtils.createZipFileFromModels({models: list.map(li => li.model)});
      if (zipResult.status === "Success") {
        zipResult.file.generateAsync({ type: "blob" }).then(content => {
          const fileName = "ADT-Instance-Models.zip";
          Utils.downloadFile(content, fileName);
        });
      }
    } catch (exc) {
      exc.customMessage = "Error downloading models";
      eventService.publishError(exc);
    }
  };

  farItems = [
    {
      key: "downloadModelsAsZip",
      text: this.props.t("modelViewerCommandBarComponent.farItems.downloadAllModels.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.downloadAllModels.text"),
      iconProps: { iconName: "DownloadDocument" },
      onClick: () => this.downloadFilesAsZip(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    },
    {
      key: "uploadModelImages",
      text: this.props.t("modelViewerCommandBarComponent.farItems.uploadModelImages.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.uploadModelImages.text"),
      iconProps: { iconName: "Photo2Add" },
      onClick: () => this.props.onUploadModelImagesClicked(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    },
    {
      key: "downloadModels",
      text: this.props.t("modelViewerCommandBarComponent.farItems.downloadModels.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.downloadModels.text"),
      iconProps: { iconName: "Refresh" },
      onClick: () => this.props.onDownloadModelsClicked(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    },
    {
      key: "uploadModel",
      text: this.props.t("modelViewerCommandBarComponent.farItems.uploadModel.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.uploadModel.text"),
      iconProps: { iconName: "Upload" },
      onClick: () => this.props.onUploadModelClicked(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    },
    {
      key: "uploadModelsDirectory",
      text: this.props.t("modelViewerCommandBarComponent.farItems.uploadModelsDirectory.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.uploadModelsDirectory.text"),
      iconProps: { iconName: "BulkUploadFolder" },
      onClick: () => this.props.onUploadModelsFolderClicked(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    },
    {
      key: "deleteModels",
      text: this.props.t("modelViewerCommandBarComponent.farItems.deleteModels.text"),
      ariaLabel: this.props.t("modelViewerCommandBarComponent.farItems.deleteModels.ariaLabel"),
      iconProps: { iconName: "Delete" },
      onClick: () => this.delete.current.open(),
      iconOnly: true,
      className: this.buttonClass,
      role: "menuitem"
    }
  ]

  render() {
    return (
      <div>
        <CommandBar
          items={this.items}
          farItems={this.farItems}
          ariaLabel={this.props.t("modelViewerCommandBarComponent.render.ariaLabel")} />
        <ModelViewerDeleteAllModelsComponent ref={this.delete} />
      </div>
    );
  }

}

export default withTranslation()(ModelViewerCommandBarComponent);
