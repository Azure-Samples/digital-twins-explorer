// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, PrimaryButton, FocusZone, FocusZoneTabbableElements, Dropdown, Icon } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";

import "./ConfigurationFormComponent.scss";

export class ConfigurationFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      appAdtUrl: "",
      environmentOptions: []
    };
    this.environments = settingsService.environments;
  }

  componentDidMount() {
    eventService.subscribeConfigure(evt => this.loadConfigurationSettings(evt));
    if (this.environments) {
      this.setState({
        environmentOptions: this.environments.map(env => env.name)
      });
    }
  }

  loadConfigurationSettings = evt => {
    if (evt.type === "start") {
      this.setState({ showModal: true, appAdtUrl: evt.appAdtUrl });
    }
  }

  saveConfigurationsSettings = e => {
    e.preventDefault();
    const config = {
      appAdtUrl: this.state.appAdtUrl
    };
    if (this.validateConfig(config)) {
      this.saveEnvironment(config);
      eventService.publishConfigure({ type: "end", config });
      this.resetModalState();
    }
  }

  saveEnvironment = config => {
    const { environmentOptions } = this.state;
    const { appAdtUrl } = config;
    if (this.environments) {
      const environment = this.environments.find(env => env.name === appAdtUrl);
      if (environment) {
        environment.config = config;
      } else {
        this.environments.push({ name: appAdtUrl, config });
        environmentOptions.push(appAdtUrl);
      }
    } else {
      this.environments = [ { name: appAdtUrl, config } ];
      environmentOptions.push(appAdtUrl);
    }
    settingsService.environments = this.environments;
  }

  validateConfig = config => {
    if (!config.appAdtUrl) {
      eventService.publishError("All fields are required.");
      return false;
    }

    if (!config.appAdtUrl.startsWith("https")) {
      eventService.publishError("ADT URL must start with ‘https’.");
      return false;
    }

    const regexp = /^(https):\/\/[\w-]+.api.[\w-.]+.[\w-.]+digitaltwins[\w-.]+/gm;
    if (!regexp.test(config.appAdtUrl)) {
      eventService.publishError("ADT URL must match the format 'https://<name>.api.<dc>.<domain>'.");
      return false;
    }

    return true;
  }

  closeConfigurationSettings = e => {
    e.preventDefault();
    eventService.publishConfigure({ type: "end" });
    this.resetModalState();
  }

  resetModalState = () => {
    this.setState({
      showModal: false,
      appAdtUrl: ""
    });
  }

  onSelectedEnvironmentChange = i => {
    if (this.environments) {
      const environment = this.environments.find(env => env.name === i.key);
      if (environment) {
        this.setState({ appAdtUrl: environment.name, ...environment.config });
      }
    }
  }

  onEnvironmentNameChange = e => {
    this.setState({ appAdtUrl: e.target.value });
  }

  onRemoveEnvironmentClick = (evt, item) => {
    evt.stopPropagation();
    const { environmentOptions, appAdtUrl } = this.state;
    const filteredOptions = environmentOptions.filter(option => option !== item);
    this.environments = this.environments.filter(env => env.name !== item);
    settingsService.environments = this.environments;
    this.setState({ environmentOptions: filteredOptions });
    if (item === appAdtUrl) {
      this.resetModalState(true);
    }
  }

  onRenderOption = item => (
    <div className="dropdown-option" onClick={() => this.onSelectedEnvironmentChange(item)}>
      <span>{item.text}</span>
      <Icon
        className="close-icon"
        iconName="ChromeClose"
        aria-hidden="true"
        onClick={e => this.onRemoveEnvironmentClick(e, item.key)}
        aria-label={`Remove ${item.text} environment`}
        role="button"
        title="Remove environment"
        tabIndex="0" />
    </div>)

  onAppAdtUrlChange = evt => this.setState({ appAdtUrl: evt.target.value })

  getStyles = () => ({
    root: {
      width: 450
    }
  })

  render() {
    const { appAdtUrl, showModal, environmentOptions } = this.state;

    return (
      <ModalComponent
        isVisible={showModal}
        className="configuration-settings">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#appClientIdField">
          <form onSubmit={this.saveConfigurationsSettings}>
            <h2 className="heading-2">Azure Digital Twins URL</h2>
            <div className="select-settings">
              <Dropdown
                placeholder="Selected Environment"
                options={environmentOptions.filter(env => env !== appAdtUrl).map(env => ({ key: env, text: env }))}
                onRenderOption={this.onRenderOption}
                styles={{
                  dropdown: { width: "100%" }
                }} />
              <TextField required id="appAdtUrlField" label="ADT URL" className="configuration-input"
                styles={this.getStyles} value={appAdtUrl} onChange={this.onAppAdtUrlChange} />
            </div>
            <p>Configuration data is saved in local storage.</p>
            <div className="btn-group">
              <PrimaryButton type="submit" className="modal-button save-button" onClick={this.saveConfigurationsSettings}>
                Save
              </PrimaryButton>
              <DefaultButton className="modal-button cancel-button" onClick={this.closeConfigurationSettings}>Cancel</DefaultButton>
            </div>
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
