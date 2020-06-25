// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { FocusZone, FocusZoneTabbableElements, Toggle, IconButton } from "office-ui-fabric-react";

import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";
import { capitalizeName } from "../../utils/utilities";
import ModalComponent from "../ModalComponent/ModalComponent";

import "./PreferencesFormComponent.scss";

export class PreferencesFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      eagerLoading: false,
      caching: false
    };
  }

  componentDidMount() {
    eventService.subscribePreferences(this.loadExistingSettings);
  }

  loadExistingSettings = () => {
    this.setState({
      showModal: true,
      eagerLoading: settingsService.eagerLoading,
      caching: settingsService.caching
    });
  }

  closeSettings = e => {
    e.preventDefault();
    this.resetModalState();
  }

  resetModalState = () => {
    this.setState({
      showModal: false,
      eagerLoading: false,
      caching: false
    });
  }

  getStyles = () => ({
    root: {
      width: 250
    }
  })

  onEagerLoadingChange = (evt, checked) => {
    this.setState({ eagerLoading: checked });
    settingsService.eagerLoading = checked;
  }

  onCachingChange = (evt, checked) => {
    this.setState({ caching: checked });
    settingsService.caching = checked;
  }

  onToggleOptionalComponentChange = id => this.props.toggleOptionalComponent(id)

  render() {
    const { optionalComponentsState } = this.props;
    const { showModal, eagerLoading, caching } = this.state;

    return (
      <ModalComponent isVisible={showModal} className="preference-settings">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#eagerLoadingField">
          <form>
            <IconButton iconProps={{ iconName: "Clear" }} ariaLabel="Close Preferences Modal"
              className="pr-close-icon" onClick={this.closeSettings} />
            <h2 className="heading-2">Performance</h2>
            <Toggle id="eagerLoadingField" className="configuration-input"
              checked={eagerLoading} onChange={this.onEagerLoadingChange} label="Eager Loading" inlineLabel />
            <Toggle id="cachingField" className="configuration-input"
              checked={caching} onChange={this.onCachingChange} label="Caching" inlineLabel />
            <h2 className="heading-2">View</h2>
            {Object.keys(optionalComponentsState).map(comp => (
              <Toggle key={comp} id={`show${capitalizeName(comp)}Field`} className="configuration-input"
                checked={optionalComponentsState[comp].visible} onChange={() => this.onToggleOptionalComponentChange(comp)}
                label={capitalizeName(comp)} inlineLabel />))}
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
