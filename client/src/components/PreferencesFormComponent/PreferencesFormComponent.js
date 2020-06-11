import React, { Component } from "react";
import { TextField, FocusZone, FocusZoneTabbableElements, ChoiceGroup, Toggle, IconButton } from "office-ui-fabric-react";

import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";
import { capitalizeName } from "../../utils/utilities";
import { REL_TYPE_OUTGOING, REL_TYPE_INCOMING, REL_TYPE_ALL } from "../../services/Constants";
import ModalComponent from "../ModalComponent/ModalComponent";

import "./PreferencesFormComponent.scss";

const relationshipTypeOptions = [
  { key: REL_TYPE_INCOMING, text: "In" },
  { key: REL_TYPE_OUTGOING, text: "Out" },
  { key: REL_TYPE_ALL, text: "In/Out" }
];

export class PreferencesFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      relTypeLoading: REL_TYPE_OUTGOING,
      relExpansionLevel: 0,
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
      relTypeLoading: settingsService.relTypeLoading,
      relExpansionLevel: settingsService.relExpansionLevel,
      eagerLoading: settingsService.eagerLoading,
      caching: settingsService.caching
    });
  }

  closeSettings = () => {
    this.resetModalState();
  }

  resetModalState = () => {
    this.setState({
      showModal: false,
      relTypeLoading: REL_TYPE_OUTGOING,
      relExpansionLevel: 0,
      eagerLoading: false,
      caching: false
    });
  }

  getStyles = () => ({
    root: {
      width: 250
    }
  })

  onSelectedRelTypeChange = (evt, item) => {
    this.setState({ relTypeLoading: item.key });
    settingsService.relTypeLoading = item.key;
  }

  onExpansionLevelChange = evt => {
    this.setState({ relExpansionLevel: evt.target.value });
    settingsService.relExpansionLevel = evt.target.value;
  }

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
    const { showModal, relTypeLoading, relExpansionLevel, eagerLoading, caching } = this.state;

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
            <h2 className="heading-2">Layer controls</h2>
            <TextField id="relExpansionLevelField" label="Select number of layers to expand"
              className="configuration-input numeric-input" styles={this.getStyles} value={relExpansionLevel}
              onChange={this.onExpansionLevelChange} type="number" min="1" max="5" />
            <ChoiceGroup defaultSelectedKey={relTypeLoading} options={relationshipTypeOptions} className="configuration-input"
              onChange={this.onSelectedRelTypeChange} label="Set expansion direction" />
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
