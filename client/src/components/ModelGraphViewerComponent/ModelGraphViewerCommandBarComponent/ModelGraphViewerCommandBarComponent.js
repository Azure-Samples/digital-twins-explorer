// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, CommandBarButton } from "office-ui-fabric-react";

import "./ModelGraphViewerCommandBarComponent.scss";

const buttonStyles = {
  label: { fontSize: 18 },
  icon: { color: "#a3a3a3" },
  iconHovered: { color: "#ffffff" }
};

const dropdownButtonStyles = {
  borderRadius: 5,
  width: 45,
  height: 30,
  marginLeft: 10
};

export class ModelGraphViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
  }

  layoutItems = [
    {
      key: "relayout",
      text: "Run Layout",
      ariaLabel: "run layout",
      iconOnly: true,
      iconProps: { iconName: "ArrangeSendToBack" },
      onClick: () => this.props.onLayoutClicked(),
      className: this.buttonClass,
      subMenuProps: {},
      style: dropdownButtonStyles
    }
  ]

  renderButton = props => (
    <CommandBarButton {...props}
      styles={buttonStyles}
      style={{ backgroundColor: "#252526", minWidth: 0, ...props.style }} />
  )

  render() {
    this.layoutItems.find(i => i.key === "relayout").subMenuProps.items = this.props.layouts.map(x => ({
      key: x,
      text: x,
      ariaLabel: x.toLowerCase(),
      iconProps: { iconName: this.props.layout === x ? "CheckMark" : "" },
      onClick: () => this.props.onLayoutChanged(x)
    }));
    return (
      <div className="commands-wrap">
        <CommandBar className="gv-commandbar"
          farItems={this.layoutItems}
          buttonAs={this.renderButton}
          ariaLabel="Use left and right arrow keys to navigate between commands" />
      </div>
    );
  }

}
