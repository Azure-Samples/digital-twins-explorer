// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";
import "./ModelViewerItemCommandBarComponent.scss";

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
    this.commandBar = React.createRef();
  }

  overflowItems = [
    {
      key: `createTwin-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.createTwin"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.createTwin"),
      onClick: () => this.props.onCreate(),
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
      key: `uploadModelImages-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.uploadModel"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.uploadModel"),
      onClick: () => this.props.onHandleModelImage(),
      style: buttonStyles
    },
    {
      key: `deleteModel-${this.props.item.key}`,
      text: this.props.t("modelViewerItemCommandBarComponent.farItems.deleteModels"),
      ariaLabel: this.props.t("modelViewerItemCommandBarComponent.farItems.deleteModels"),
      onClick: () => this.props.onDelete(),
      style: buttonStyles
    }
  ];

  clickOverflowButton = () => {
    if (this.commandBar.current && this.commandBar.current.querySelector(".ms-CommandBar-overflowButton")) {
      this.commandBar.current.querySelector(".ms-CommandBar-overflowButton").click();
    }
  }

  render() {
    const { showItemMenu } = this.props;
    return (
      <div ref={this.commandBar}>
        <CommandBar
          styles={{
            root: {
              padding: 0,
              height: 22
            }
          }}
          overflowItems={showItemMenu ? this.overflowItems : []}
          overflowButtonProps={{
            menuProps: {
              className: "model-viewer-item-command-bar-overflow-menu",
              items: [],
              calloutProps: {
                styles: {
                  root: {
                    marginLeft: "55px",
                    marginTop: "-30px"
                  }
                }
              }
            }
          }}
          onKeyDown={this.props.onKeyDown}
          ariaLabel={this.props.t("modelViewerItemCommandBarComponent.ariaLabel")} />
      </div>
    );
  }

}

export default withTranslation("translation", { withRef: true })(ModelViewerItemCommandBarComponent);
