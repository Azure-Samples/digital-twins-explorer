// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, PrimaryButton, FocusZone, FocusZoneTabbableElements } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";

import "./ConfigurationFormComponent.scss";

export class ConfigurationFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      appClientId: "",
      appTenantId: "",
      appAdtUrl: ""
    };
  }

  componentDidMount() {
    eventService.subscribeConfigure(evt => this.loadConfigurationSettings(evt));
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
    if (config.appClientId && config.appTenantId && config.appAdtUrl) {
      eventService.publishConfigure({ type: "end", config });
      this.resetModalState();
    }
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

  onAppClientIdChange = evt => this.setState({ appClientId: evt.target.value })

  onAppTenantIdChange = evt => this.setState({ appTenantId: evt.target.value })

  onAppAdtUrlChange = evt => this.setState({ appAdtUrl: evt.target.value })

  getStyles = () => ({
    root: {
      width: 450
    }
  })

  render() {
    const { appClientId, appTenantId, appAdtUrl, showModal } = this.state;

    return (
      <ModalComponent
        isVisible={showModal}
        className="configuration-settings">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#appClientIdField">
          <form onSubmit={this.saveConfigurationsSettings}>
            <h2 className="heading-2">Sign In</h2>
            <TextField required id="appClientIdField" label="Client ID" className="configuration-input"
              styles={this.getStyles} value={appClientId} onChange={this.onAppClientIdChange} />
            <TextField required id="appTenantIdField" label="Tenant ID" className="configuration-input"
              styles={this.getStyles} value={appTenantId} onChange={this.onAppTenantIdChange} />
            <TextField required id="appAdtUrlField" label="ADT URL" className="configuration-input"
              styles={this.getStyles} value={appAdtUrl} onChange={this.onAppAdtUrlChange} />
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
