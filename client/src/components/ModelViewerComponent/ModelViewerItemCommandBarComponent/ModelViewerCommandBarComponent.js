// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

class ModelViewerItemCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
  }

  farItems = [
    {
      key: `deleteModel-${this.props.item.key}`,
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.deleteModels"),
      iconProps: { iconName: "Delete" },
      onClick: () => this.props.onDelete(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `uploadModelImages-${this.props.item.key}`,
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.uploadModel"),
      iconProps: { iconName: "ImageSearch" },
      onClick: () => this.props.onHandleModelImage(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `viewModel-${this.props.item.key}`,
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.viewModel"),
      iconProps: { iconName: "Info" },
      onClick: () => this.props.onView(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `createTwin-${this.props.item.key}`,
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.createTwin"),
      iconProps: { iconName: "AddTo" },
      onClick: () => this.props.onCreate(),
      iconOnly: true,
      className: this.buttonClass
    }
  ];

  render() {
    return (
      <CommandBar
        styles={{
          root: {
            padding: 0,
            height: 22
          }
        }}
        farItems={this.farItems}
        ariaLabel={this.props.t("modelViewerItemCommandBarComponent.ariaLabel")} />
    );
  }

}

export default withTranslation()(ModelViewerItemCommandBarComponent);
