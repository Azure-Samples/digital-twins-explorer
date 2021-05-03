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

class AppCommandBar extends Component {

  constructor(props) {
    super(props);
    this.delete = React.createRef();
    this.state = {
      farItems: [
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
      await eventService.publishConfigure({ type: "start", appAdtUrl });
    } catch (exc) {
      if (exc.errorCode !== "user_cancelled") {
        exc.customMessage = "Error on saving settings";
        eventService.publishError(exc);
      }
    }
  }

  togglePreferencesModal = () => {
    eventService.publishPreferences();
  }

  render() {
    const { farItems } = this.state;
    return (
      <div className="app-commandbar-container">
        <CommandBar
          farItems={farItems}
          ariaLabel={this.props.t("appCommandBar.commandBar.ariaLabel")}
          className="app-commandbar" />
        <ConfigurationFormComponent t={this.props.t} />
        <PreferencesFormComponent
          toggleOptionalComponent={this.props.toggleOptionalComponent}
          optionalComponentsState={this.props.optionalComponentsState}
          t={this.props.t} />
        <DeleteAllTwinsComponent ref={this.delete} t={this.props.t} />
      </div>
    );
  }

}

export default withTranslation()(AppCommandBar);
