// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, TextField, Icon, CommandBarButton, ComboBox, DirectionalHint } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";
import { REL_TYPE_OUTGOING, REL_TYPE_INCOMING, REL_TYPE_ALL, DEFAULT_DISPLAY_NAME_PROPERTY } from "../../../services/Constants";

import "./GraphViewerCommandBarComponent.scss";

const buttonStyles = {
  label: { fontSize: 18 },
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
      ariaChecked: true,
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
      iconProps: { iconName: "ExpansionDirection" },
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
      iconProps: { iconName: "ExpansionLevel" },
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
      iconProps: { iconName: "ChooseLayout" },
      onClick: () => this.props.onLayoutClicked(),
      className: this.buttonClass,
      subMenuProps: {},
      style: dropdownButtonStyles
    }
  ]

  displayNameItems = [
    {
      key: "displayName",
      text: this.props.t("graphViewerCommandBarComponent.displayName.ariaLabel"),
      ariaLabel: this.props.t("graphViewerCommandBarComponent.displayName.ariaLabel"),
      iconOnly: true,
      iconProps: { iconName: "Rename" },
      className: this.buttonClass,
      subMenuProps: {},
      style: dropdownButtonStyles
    }
  ]

  renderRelationshipExpansionItem = () => (
    <div className="expansion-level-option">
      <Icon iconName="ExpansionLevel" />
      <TextField id="relExpansionLevelField"
        className="command-bar-input configuration-input numeric-input" value={this.state.relExpansionLevel}
        onChange={this.onExpansionLevelChange} type="number" min="1" max="5" ariaLabel="Select expansion level" ariaLive="assertive" role="menuitem" />
    </div>
  )

  renderDisplayNameSelectionItem = () => {
    const options = [ {
      text: DEFAULT_DISPLAY_NAME_PROPERTY,
      key: DEFAULT_DISPLAY_NAME_PROPERTY
    },
    ...this.props.displayNameProperties.map(property => (
      {
        key: property.displayName,
        text: property.displayName,
        data: property
      })) ];
    const onChange = (_e, option) => {
      if (option) {
        this.props.setSelectedDisplayNameProperty(option.key);
      }
    };

    return (<div className="display-name-container">
      <Icon iconName="Rename" className="display-name-icon" />
      <ComboBox
        scrollSelectedToTop={1}
        selectedKey={this.props.selectedDisplayNameProperty}
        className="display-name-combobox"
        options={options}
        autoComplete="on"
        onRenderUpperContent={() => (
          <div className={`display-name-combobox-fallback-description${this.props.isDisplayNameAsteriskPresent ? " asterisk-present" : ""}`}>
            {this.props.t("graphViewerCommandBarComponent.displayName.fallbackLabelDescription")}
          </div>
        )}
        onRenderOption={optionProps => (
          <>
            {optionProps.text}
            {optionProps.data && <span
              title={this.props.t("graphViewerCommandBarComponent.displayName.occurrenceTitle")}
              className="display-name-occurrence-count">
              ({optionProps.data.count})
            </span>}
          </>)}
        styles={{
          root: {
            "&::after": {
              border: "1px solid #353535"
            }
          }
        }}
        calloutProps={{ calloutMaxHeight: 600, directionalHint: DirectionalHint.right, calloutMinWidth: 200}}
        onChange={onChange} />
    </div>);
  }

  renderButton = props => (
    <CommandBarButton {...props}
      tabIndex={0}
      styles={buttonStyles}
      style={{ backgroundColor: "#252526", minWidth: 0, ...props.style }} />
  )

  onSelectedRelTypeChange = type => {
    settingsService.relTypeLoading = type;
    this.setState({ relTypeLoading: type });
  }

  readValueChange = () => {
    //  Screen Reader: Read value change
    const field = document.getElementById("relExpansionLevelField");
    field.blur();
    setTimeout(() => {
      field.focus();
    }, [ 100 ]);
  }

  onExpansionLevelChange = evt => {
    this.setState({ relExpansionLevel: evt.target.value });
    settingsService.relExpansionLevel = evt.target.value;
    this.readValueChange();
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
          <CommandBar className="gv-commandbar light-command-bar"
            farItems={this.displayNameItems}
            buttonAs={this.renderDisplayNameSelectionItem}
            ariaLabel="graphViewerCommandBarComponent.render.commandBarAriaLabel"
            areLive="assertive" />
          <CommandBar className="gv-commandbar button-group light-command-bar"
            farItems={this.buttonGroupItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")}
            ariaLive="assertive" />
          <CommandBar className="gv-commandbar light-command-bar"
            farItems={this.expansionLevelItems}
            buttonAs={this.renderRelationshipExpansionItem}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")}
            ariaLive="assertive" />
          <CommandBar className="gv-commandbar light-command-bar"
            farItems={this.expansionModeItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")}
            ariaLive="assertive" />
          <CommandBar className="gv-commandbar light-command-bar"
            farItems={this.layoutItems}
            buttonAs={this.renderButton}
            ariaLabel={this.props.t("graphViewerCommandBarComponent.render.commandBarAriaLabel")}
            ariaLive="assertive" />
        </div>
        <input id="model-file-input" type="file" name="name" className="gc-fileInput" ref={this.importModelRef}
          onChange={this.onImportGraphClicked} />
      </>
    );
  }

}

export default withTranslation("translation", { withRef: true })(GraphViewerCommandBarComponent);
