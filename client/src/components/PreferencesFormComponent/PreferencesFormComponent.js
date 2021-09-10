// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { FocusZone, FocusZoneTabbableElements, Toggle, IconButton } from "office-ui-fabric-react";

import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";
import { capitalizeName } from "../../utils/utilities";
import ModalComponent from "../ModalComponent/ModalComponent";

import "./PreferencesFormComponent.scss";

const ENTER_KEY_CODE = 13;
const SPACE_KEY_CODE = 32;

export class PreferencesFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      eagerLoading: false,
      caching: false
    };
    this.hasOpenedConsole = false;
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
    if (this.hasOpenedConsole) {
      eventService.publishFocusConsole();
    }
    this.resetModalState();
  }

  resetModalState = () => {
    this.setState({
      showModal: false,
      eagerLoading: false,
      caching: false
    });
    this.hasOpenedConsole = false;
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

  toggleHighContrastMode = (evt, checked) => {
    this.props.toggleHighContrastMode(checked);
  }

  onToggleOptionalComponentChange = id => this.props.toggleOptionalComponent(id)

  handleToggleKeypress = (e, component) => {
    if ((e.keyCode === ENTER_KEY_CODE || e.keyCode === SPACE_KEY_CODE) && component === "console") {
      this.hasOpenedConsole = true;
    }
  }

  render() {
    const { optionalComponentsState, contrast } = this.props;
    const { showModal, eagerLoading, caching } = this.state;

    return (
      <ModalComponent isVisible={showModal} className="preference-settings">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#eagerLoadingField">
          <form>
            <IconButton iconProps={{ iconName: "Clear" }} ariaLabel={this.props.t("preferencesFormComponent.ariaLabel")}
              className="pr-close-icon" onClick={this.closeSettings} />
            <h2 className="heading-2">{this.props.t("preferencesFormComponent.heading1")}</h2>
            <Toggle id="eagerLoadingField" className="configuration-input"
              checked={eagerLoading} onChange={this.onEagerLoadingChange} label={this.props.t("preferencesFormComponent.eagerLoadingField")} inlineLabel />
            <Toggle id="cachingField" className="configuration-input"
              checked={caching} onChange={this.onCachingChange} label={this.props.t("preferencesFormComponent.cachingField")} inlineLabel />
            <h2 className="heading-2">{this.props.t("preferencesFormComponent.heading2")}</h2>
            {optionalComponentsState.map(comp => (
              <Toggle key={comp.id} id={`show${capitalizeName(comp.id)}Field`} className="configuration-input"
                checked={comp.show} onChange={() => this.onToggleOptionalComponentChange(comp.id)}
                label={capitalizeName(comp.name)} inlineLabel onKeyDown={e => this.handleToggleKeypress(e, comp.id)} />))}
            <h2 className="heading-2">{this.props.t("preferencesFormComponent.heading3")}</h2>
            <Toggle id="highContrastField" className="configuration-input"
              checked={contrast === "high-contrast"} onChange={this.toggleHighContrastMode} label={this.props.t("preferencesFormComponent.highContrastField")} inlineLabel />
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
