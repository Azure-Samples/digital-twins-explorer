// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react/lib/";
import { withTranslation } from "react-i18next";

import { ConfigurationFormComponent } from "../ConfigurationFormComponent/ConfigurationFormComponent";
import { PreferencesFormComponent } from "../PreferencesFormComponent/PreferencesFormComponent";
import { configService } from "../../services/ConfigService";
import { eventService } from "../../services/EventService";
import DeleteAllTwinsComponent from "./DeleteAllTwinsComponent/DeleteAllTwinsComponent";

import "./AppCommandBar.scss";
import { KeyboardShortcutsComponents } from "../KeyboardShortcutsComponents/KeyboardShortcutsComponents";

class AppCommandBar extends Component {

  constructor(props) {
    super(props);
    this.delete = React.createRef();
    this.configure = React.createRef();
    this.preferences = React.createRef();
    this.keyboard = React.createRef();
    this.state = {
      farItems: [
        {
          key: "keyboardShortcuts",
          text: this.props.t("appCommandBar.keyboardShortcuts.text"),
          ariaLabel: this.props.t("appCommandBar.keyboardShortcuts.ariaLabel"),
          iconProps: { iconName: "KeyboardClassic" },
          onClick: () => this.keyboard.current.open(),
          iconOnly: true,
          className: "app-toolbarButtons"
        },
        {
          key: "deleteTwins",
          text: this.props.t("appCommandBar.deleteTwins.text"),
          ariaLabel: this.props.t("appCommandBar.deleteTwins.ariaLabel"),
          iconProps: { iconName: "Delete" },
          onClick: () => this.delete.current.open(),
          iconOnly: true,
          className: "app-toolbarButtons delete-button"
        },
        {
          key: "signIn",
          text: this.props.t("appCommandBar.signIn.text"),
          ariaLabel: this.props.t("appCommandBar.signIn.ariaLabel"),
          iconOnly: true,
          iconProps: { iconName: "Signin" },
          split: true,
          onClick: () => this.updateAdtUrlSettings(),
          className: "app-toolbarButtons"
        },
        {
          key: "settings",
          text: this.props.t("appCommandBar.settings.text"),
          ariaLabel: this.props.t("appCommandBar.settings.ariaLabel"),
          iconOnly: true,
          iconProps: { iconName: "Settings" },
          onClick: () => this.togglePreferencesModal(),
          className: "app-toolbarButtons settings-button"
        }
      ]
    };
  }

  updateAdtUrlSettings = async () => {
    try {
      const { appAdtUrl } = await configService.getConfig();
      this.configure.current.loadConfigurationSettings({ type: "start", appAdtUrl });
    } catch (exc) {
      if (exc.errorCode !== "user_cancelled") {
        exc.customMessage = "Error on saving settings";
        eventService.publishError(exc);
      }
    }
  }

  togglePreferencesModal = () => {
    this.preferences.current.loadExistingSettings();
  }

  render() {
    const { farItems } = this.state;
    return (
      <div className="app-commandbar-container">
        <CommandBar
          farItems={farItems}
          ariaLabel={this.props.t("appCommandBar.commandBar.ariaLabel")}
          className="app-commandbar" />
        <ConfigurationFormComponent t={this.props.t} ref={this.configure} />
        <PreferencesFormComponent ref={this.preferences}
          toggleHighContrastMode={this.props.toggleHighContrastMode}
          toggleOptionalComponent={this.props.toggleOptionalComponent}
          optionalComponentsState={this.props.optionalComponentsState}
          contrast={this.props.contrast}
          t={this.props.t} />
        <DeleteAllTwinsComponent ref={this.delete} t={this.props.t} />
        <KeyboardShortcutsComponents ref={this.keyboard} t={this.props.t} />
      </div>
    );
  }

}

export default withTranslation()(AppCommandBar);
