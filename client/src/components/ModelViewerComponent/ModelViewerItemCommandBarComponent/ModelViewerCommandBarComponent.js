// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

const buttonStyles = {
  fontSize: 14,
  fontWeight: 600,
  "&:focus": {
    background: "#efefef"
  }
};
class ModelViewerItemCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
  }

  overflowItems = [
    {
      key: `deleteModel-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.deleteModels"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.deleteModels"),
      onClick: () => this.props.onDelete(),
      style: buttonStyles
    },
    {
      key: `uploadModelImages-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.uploadModel"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.uploadModel"),
      onClick: () => this.props.onHandleModelImage(),
      style: buttonStyles
    },
    {
      key: `viewModel-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.viewModel"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.viewModel"),
      onClick: () => this.props.onView(),
      style: buttonStyles
    },
    {
      key: `createTwin-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.createTwin"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.createTwin"),
      onClick: () => this.props.onCreate(),
      style: buttonStyles
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
        overflowItems={this.overflowItems}
        calloutProps={{ style: { background: "red" }}}
        ariaLabel={this.props.t("modelViewerItemCommandBarComponent.ariaLabel")} />
    );
  }

}

export default withTranslation()(ModelViewerItemCommandBarComponent);
