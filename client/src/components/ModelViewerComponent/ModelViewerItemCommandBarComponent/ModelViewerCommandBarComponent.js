// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";

export class ModelViewerItemCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
  }

  farItems = [
    {
      key: `deleteModel-${this.props.item.key}`,
      ariaLabel: "Delete Model",
      iconProps: { iconName: "Delete" },
      onClick: () => this.props.onDelete(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `uploadModelImages-${this.props.item.key}`,
      ariaLabel: "Upload Model Image",
      iconProps: { iconName: "ImageSearch" },
      onClick: () => this.props.onHandleModelImage(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `viewModel-${this.props.item.key}`,
      ariaLabel: "View Model",
      iconProps: { iconName: "Info" },
      onClick: () => this.props.onView(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: `createTwin-${this.props.item.key}`,
      ariaLabel: "Create a Twin",
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
        ariaLabel="Use left and right arrow keys to navigate between commands" />
    );
  }

}
