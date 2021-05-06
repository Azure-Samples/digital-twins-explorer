// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, TextField, Icon, CommandBarButton } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";
import { REL_TYPE_OUTGOING, REL_TYPE_INCOMING, REL_TYPE_ALL } from "../../../services/Constants";

import "./GraphViewerCommandBarComponent.scss";

const buttonStyles = {
  label: { fontSize: 18 },
  icon: { color: "#a3a3a3" },
  iconHovered: { color: "#ffffff" }
};

const singleButtonStyles = {
  width: 30,
  height: 30
};

const dropdownButtonStyles = {
  borderRadius: 5,
  width: 45,
  height: 30,
  marginLeft: 10
};

class GraphViewerCommandBarComponent extends Component {

  constructor(props) {
    super(props);
    this.buttonClass = this.props.buttonClass;
    this.state = {
      relTypeLoading: settingsService.relTypeLoading,
      relExpansionLevel: settingsService.relExpansionLevel
    };
    this.importModelRef = React.createRef();
  }

  buttonGroupItems = [
    {
      key: "exportGraph",
      text: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.exportGraph"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.exportGraph"),
      iconProps: { iconName: "CloudDownload" },
      onClick: () => this.onExportGraphClicked(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "importGraph",
      text: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.importGraph"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.importGraph"),
      iconProps: { iconName: "CloudUpload" },
      onClick: () => this.importModelRef.current.click(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "showTwins",
      text: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.showTwins"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.showTwins"),
      iconProps: { iconName: "RedEye" },
      onClick: () => this.props.onShowAll(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "showRelationships",
      text: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.showRelationships.text"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.buttonGroupItems.showRelationships.ariaLabel"),
      iconProps: { iconName: "Link" },
      onClick: () => this.props.onShowAllRelationships(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    }
  ]

  expansionModeItems = [
    {
      key: "expansionMode",
      text: this.props.t("graphViewerCommandBarComponent.expansionModeItems.text"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.expansionModeItems.ariaLabel"),
      iconOnly: true,
      iconProps: { iconName: "ModelingView" },
      className: `${this.buttonClass} command-bar-dropdown`,
      style: dropdownButtonStyles,
      subMenuProps: {
        items: [
          {
            key: REL_TYPE_INCOMING,
            text: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_INCOMING"),
            ariaLabel: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_INCOMING"),
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_INCOMING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_INCOMING)
          },
          {
            key: REL_TYPE_OUTGOING,
            text: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_OUTGOING"),
            ariaLabel: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_OUTGOING"),
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_OUTGOING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_OUTGOING)
          },
          {
            key: REL_TYPE_ALL,
            text: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_ALL"),
            ariaLabel: this.props.t("graphViewerCommandBarComponent.expansionModeItems.subMenuProps.REL_TYPE_ALL"),
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_ALL ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_ALL)
          }
        ]
      }
    }
  ]

  expansionLevelItems = [
    {
      key: "expansionLevel",
      text: this.props.t("graphViewerCommandBarComponent.expansionLevelItems.text"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.expansionLevelItems.ariaLabel"),
      iconProps: { iconName: "Org" },
      className: this.buttonClass,
      iconOnly: true,
      style: singleButtonStyles
    }
  ]

  layoutItems = [
    {
      key: "relayout",
      text: this.props.t("graphViewerCommandBarComponent.layoutItems.ariaLabel"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.layoutItems.ariaLabel"),
      iconOnly: true,
      iconProps: { iconName: "ArrangeSendToBack" },
      onClick: () => this.props.onLayoutClicked(),
      className: this.buttonClass,
      subMenuProps: {},
      style: dropdownButtonStyles
    }
  ]

  renderRelationshipExpansionItem = () => (
    <div className="expansion-level-option">
      <Icon iconName="Org" />
      <TextField id="relExpansionLevelField"
        className="command-bar-input configuration-input numeric-input" value={this.state.relExpansionLevel}
        onChange={this.onExpansionLevelChange} type="number" min="1" max="5" ariaLabel="Select expansion level" role="menuitem" />
    </div>
  )

  renderButton = props => (
    <CommandBarButton {...props}
      styles={buttonStyles}
      style={{ backgroundColor: "#252526", minWidth: 0, ...props.style }} />
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
    const { query, canShowAll, canShowAllRelationships } = this.props;
    this.buttonGroupItems.find(i => i.key === "showRelationships").disabled = !canShowAllRelationships;
    this.buttonGroupItems.find(i => i.key === "showTwins").disabled = !canShowAll;
    this.buttonGroupItems.find(i => i.key === "exportGraph").disabled = this.layoutItems.find(i => i.key === "relayout").disabled = !query;
    this.layoutItems.find(i => i.key === "relayout").subMenuProps.items = this.props.layouts.map(x => ({
      key: x,
      text: x,
      ariaLabel: x.toLowerCase(),
      iconProps: { iconName: this.props.layout === x ? "CheckMark" : "" },
      onClick: () => this.props.onLayoutChanged(x)
    }));
    this.expansionModeItems.find(item => item.key === "expansionMode").subMenuProps.items
      = this.expansionModeItems.find(item => item.key === "expansionMode").subMenuProps.items.map(item => {
        item.iconProps = { iconName: item.key === this.state.relTypeLoading ? "CheckMark" : "" };
        return item;
      });
    return (
      <>
        <div className="commands-wrap">
          <CommandBar className="gv-commandbar button-group"
            farItems={this.buttonGroupItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")} />
          <CommandBar className="gv-commandbar"
            farItems={this.expansionLevelItems}
            buttonAs={this.renderRelationshipExpansionItem}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")} />
          <CommandBar className="gv-commandbar"
            farItems={this.expansionModeItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")} />
          <CommandBar className="gv-commandbar"
            farItems={this.layoutItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")} />
        </div>
        <input id="model-file-input" type="file" name="name" className="gc-fileInput" ref={this.importModelRef}
          onChange={this.onImportGraphClicked} />
      </>
    );
  }

}

export default withTranslation()(GraphViewerCommandBarComponent);
