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
      appClientId: "",
      appTenantId: "",
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
      this.setState({ showModal: true, ...evt.config });
    }
  }

  saveConfigurationsSettings = e => {
    e.preventDefault();
    const config = {
      appClientId: this.state.appClientId,
      appTenantId: this.state.appTenantId,
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
    if (!config.appClientId || !config.appTenantId || !config.appAdtUrl) {
      eventService.publishError("*** All fields are required.");
      return false;
    }

    if (!config.appAdtUrl.startsWith("https")) {
      eventService.publishError("*** ADT URL must start with ‘https’.");
      return false;
    }

    const regexp = /^(https):\/\/[\w-]+.api.[\w-.]+.[\w-.]+digitaltwins[\w-.]+/gm;
    if (!regexp.test(config.appAdtUrl)) {
      eventService.publishError("*** ADT URL must match the format 'https://<name>.api.<dc>.<domain>'.");
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
      appClientId: "",
      appTenantId: "",
      appAdtUrl: ""
    });
  }

  onSelectedEnvironmentChange = (e, i) => {
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

  onRemoveEnvironmentClick = item => {
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
    <div className="dropdown-option">
      <span>{item.text}</span>
      <Icon
        className="close-icon"
        iconName="ChromeClose"
        aria-hidden="true"
        onClick={() => this.onRemoveEnvironmentClick(item.key)}
        aria-label={`Remove ${item} environment`}
        role="button"
        title="Remove environment"
        tabIndex="0" />
    </div>)

  onAppClientIdChange = evt => this.setState({ appClientId: evt.target.value })

  onAppTenantIdChange = evt => this.setState({ appTenantId: evt.target.value })

  onAppAdtUrlChange = evt => this.setState({ appAdtUrl: evt.target.value })

  getStyles = () => ({
    root: {
      width: 450
    }
  })

  render() {
    const { appClientId, appTenantId, appAdtUrl, showModal, environmentOptions } = this.state;

    return (
      <ModalComponent
        isVisible={showModal}
        className="configuration-settings">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#appClientIdField">
          <form onSubmit={this.saveConfigurationsSettings}>
            <h2 className="heading-2">Sign In</h2>
            <div className="select-settings">
              <Dropdown
                placeholder="Selected Environment"
                options={environmentOptions.map(env => ({ key: env, text: env }))}
                onRenderOption={this.onRenderOption}
                styles={{
                  dropdown: { width: "100%" }
                }}
                onChange={this.onSelectedEnvironmentChange} />
              <TextField required id="appAdtUrlField" label="ADT URL" className="configuration-input"
                styles={this.getStyles} value={appAdtUrl} onChange={this.onAppAdtUrlChange} />
            </div>
            <TextField required id="appClientIdField" label="Client ID" className="configuration-input"
              styles={this.getStyles} value={appClientId} onChange={this.onAppClientIdChange} />
            <TextField required id="appTenantIdField" label="Tenant ID" className="configuration-input"
              styles={this.getStyles} value={appTenantId} onChange={this.onAppTenantIdChange} />
            <p>Configuration data is saved in local storage.</p>
            <div className="btn-group">
              <PrimaryButton type="submit" className="modal-button save-button" onClick={this.saveConfigurationsSettings}>
                Connect
              </PrimaryButton>
              <DefaultButton className="modal-button cancel-button" onClick={this.closeConfigurationSettings}>Cancel</DefaultButton>
            </div>
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
