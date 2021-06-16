// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, TextField, Icon, CommandBarButton } from "office-ui-fabric-react";

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

export class GraphViewerCommandBarComponent extends Component {

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
      text: "Export graph",
      iconProps: { iconName: "CloudDownload" },
      onClick: () => this.onExportGraphClicked(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "importGraph",
      text: "Import graph",
      iconProps: { iconName: "CloudUpload" },
      onClick: () => this.importModelRef.current.click(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "showTwins",
      text: "Show All",
      iconProps: { iconName: "RedEye" },
      onClick: () => this.props.onShowAll(),
      iconOnly: true,
      className: this.buttonClass,
      style: singleButtonStyles
    },
    {
      key: "showRelationships",
      text: "Show All Relationships",
      ariaLabel: "show all relationships",
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
      text: "Expansion Mode",
      ariaLabel: "select expansion mode",
      iconOnly: true,
      iconProps: { iconName: "ModelingView" },
      className: `${this.buttonClass} command-bar-dropdown`,
      style: dropdownButtonStyles,
      subMenuProps: {
        items: [
          {
            key: REL_TYPE_INCOMING,
            text: "In",
            ariaLabel: "In",
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_INCOMING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_INCOMING)
          },
          {
            key: REL_TYPE_OUTGOING,
            text: "Out",
            ariaLabel: "Out",
            iconProps: { iconName: settingsService.relTypeLoading === REL_TYPE_OUTGOING ? "CheckMark" : "" },
            onClick: () => this.onSelectedRelTypeChange(REL_TYPE_OUTGOING)
          },
          {
            key: REL_TYPE_ALL,
            text: "In/Out",
            ariaLabel: "In/Out",
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
      text: "Expansion level",
      ariaLabel: "Select number of layers to expand",
      iconProps: { iconName: "Org" },
      className: this.buttonClass,
      iconOnly: true,
      style: singleButtonStyles
    }
  ]

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

  renderRelationshipExpansionItem = () => (
    <div className="expansion-level-option">
      <Icon iconName="Org" />
      <TextField id="relExpansionLevelField"
        className="command-bar-input configuration-input numeric-input" value={this.state.relExpansionLevel}
        onChange={this.onExpansionLevelChange} type="number" min="1" max="5" />
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
            ariaLabel="Use left and right arrow keys to navigate between commands" />
          <CommandBar className="gv-commandbar"
            farItems={this.expansionLevelItems}
            buttonAs={this.renderRelationshipExpansionItem}
            ariaLabel="Use left and right arrow keys to navigate between commands" />
          <CommandBar className="gv-commandbar"
            farItems={this.expansionModeItems}
            buttonAs={this.renderButton}
            ariaLabel="Use left and right arrow keys to navigate between commands" />
          <CommandBar className="gv-commandbar"
            farItems={this.layoutItems}
            buttonAs={this.renderButton}
            ariaLabel="Use left and right arrow keys to navigate between commands" />
        </div>
        <input id="file-input" type="file" name="name" className="gc-fileInput" ref={this.importModelRef}
          onChange={this.onImportGraphClicked} />
      </>
    );
  }

}
