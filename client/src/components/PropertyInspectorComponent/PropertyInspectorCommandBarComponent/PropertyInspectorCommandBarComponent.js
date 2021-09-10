// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { CommandBar } from "office-ui-fabric-react";
class PropertyInspectorCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
  }

  farItems = [
    {
      key: "expandTree",
      text: this.props.t("propertyInspectorCommandBarComponent.farItems.expandTree"),
      ariaLabel: this.props.t("propertyInspectorCommandBarComponent.farItems.expandTree"),
      iconProps: { iconName: "ExploreContent" },
      onClick: () => this.props.onExpand(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "collapseTree",
      text: this.props.t("propertyInspectorCommandBarComponent.farItems.collapseTree"),
      ariaLabel: this.props.t("propertyInspectorCommandBarComponent.farItems.collapseTree"),
      iconProps: { iconName: "CollapseContent" },
      onClick: () => this.props.onCollapse(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "undo",
      text: this.props.t("propertyInspectorCommandBarComponent.farItems.undo"),
      ariaLabel: this.props.t("propertyInspectorCommandBarComponent.farItems.undo"),
      iconProps: { iconName: "Undo" },
      onClick: () => this.props.onUndo(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "redo",
      text: this.props.t("propertyInspectorCommandBarComponent.farItems.redo"),
      ariaLabel: this.props.t("propertyInspectorCommandBarComponent.farItems.redo"),
      iconProps: { iconName: "Redo" },
      onClick: () => this.props.onRedo(),
      iconOnly: true,
      className: this.buttonClass
    },
    {
      key: "save",
      text: this.props.t("propertyInspectorCommandBarComponent.farItems.save"),
      ariaLabel: this.props.t("propertyInspectorCommandBarComponent.farItems.save"),
      iconProps: { iconName: "Save" },
      onClick: () => this.props.onSave(),
      iconOnly: true,
      className: this.buttonClass
    }
  ]

  render() {
    const { changed, selection, selectionType } = this.props;
    this.farItems.forEach(x => x.disabled = !selection || selectionType !== "twin");
    this.farItems[this.farItems.length - 1].disabled = !changed || selectionType !== "twin";

    return (
      <div className="pi-command-bar">
        <div className="pi-title">{this.props.t("propertyInspectorCommandBarComponent.commandBar.title")}</div>
        <CommandBar
          farItems={this.farItems}
          ariaLabel={this.props.t("propertyInspectorCommandBarComponent.commandBar.ariaLabel")} />
      </div>
    );
  }

}

export default withTranslation()(PropertyInspectorCommandBarComponent);
