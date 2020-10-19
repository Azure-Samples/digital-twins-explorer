// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react/lib/";

import { ConfigurationFormComponent } from "../ConfigurationFormComponent/ConfigurationFormComponent";
import { PreferencesFormComponent } from "../PreferencesFormComponent/PreferencesFormComponent";
import { configService } from "../../services/ConfigService";
import { eventService } from "../../services/EventService";
import { print } from "../../services/LoggingService";
import DeleteAllTwinsComponent from "./DeleteAllTwinsComponent/DeleteAllTwinsComponent";

import "./AppCommandBar.scss";

export class AppCommandBar extends Component {

  constructor(props) {
    super(props);
    this.delete = React.createRef();
    this.state = {
      farItems: [
        {
          key: "deleteTwins",
          text: "Delete All Twins",
          ariaLabel: "delete all twins",
          iconProps: { iconName: "Delete" },
          onClick: () => this.delete.current.open(),
          iconOnly: true,
          className: "app-toolbarButtons delete-button"
        },
        {
          key: "signIn",
          text: "ADT URL",
          ariaLabel: "adt url",
          iconOnly: true,
          iconProps: { iconName: "Signin" },
          split: true,
          onClick: () => this.updateAdtUrlSettings(),
          className: "app-toolbarButtons"
        },
        {
          key: "settings",
          text: "Settings",
          ariaLabel: "settings",
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
    } catch (e) {
      if (e.errorCode !== "user_cancelled") {
        print(`*** Error on saving settings: ${e}`, "error");
        eventService.publishError(`*** Error on saving settings: ${e}`);
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
          ariaLabel="Use left and right arrow keys to navigate between commands"
          className="app-commandbar" />
        <ConfigurationFormComponent />
        <PreferencesFormComponent
          toggleOptionalComponent={this.props.toggleOptionalComponent}
          optionalComponentsState={this.props.optionalComponentsState} />
        <DeleteAllTwinsComponent ref={this.delete} />
      </div>
    );
  }

}
