// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, Dropdown, DefaultButton, Icon, IconButton,
  FocusZone, FocusZoneTabbableElements, Checkbox } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import { print } from "../../services/LoggingService";
import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";

import "./QueryComponent.scss";
import { SaveQueryDialogComponent } from "./SaveQueryDialogComponent/SaveQueryDialogComponent";
import { ConfirmQueryDialogComponent } from "./ConfirmQueryDialogComponent/ConfirmQueryDialogComponent";

const defaultQuery = "SELECT * FROM digitaltwins";

const ENTER_KEY_CODE = 13;
class QueryComponent extends Component {

  queryOptions = [
    { key: "query", text: "Query" },
    { key: "save", text: "Save Query" }
  ]

  constructor(props) {
    super(props);
    this.state = {
      queries: [],
      selectedQuery: defaultQuery,
      selectedQueryMultiline: defaultQuery,
      selectedQueryKey: null,
      queryKeyToBeRemoved: "",
      showSaveQueryModal: false,
      showConfirmDeleteModal: false,
      showConfirmOverwriteModal: false,
      newQueryName: "",
      isOverlayResultsChecked: false,
      multiline: false,
      multilineHolder: false,
      isFocused: false,
      disabled: false,
      rowCount: 2
    };
  }

  componentDidMount() {
    this.setState({ queries: settingsService.queries });
    eventService.subscribeEnvironmentChange(this.clearAfterEnvironmentChange);
  }

  onKeyFunction = event => {
    this.setState({ disabled: false });
    const enterPressed = event.key === "Enter";
    if (event.shiftKey && enterPressed) {
      if (!this.state.multilineHolder) {
        this.setState({ selectedQueryMultiline: event.target.value });
      }
      this.setState({ multiline: true, multilineHolder: true });
      this.queryField.focus();
    } else if (enterPressed) {
      this.executeQuery(event);
      event.preventDefault();
    }
  }

  componentWillUnmount() {
    eventService.unsubscribeEnvironmentChange(this.clearAfterEnvironmentChange);
  }

  clearAfterEnvironmentChange = () => {
    this.setState({
      selectedQuery: defaultQuery,
      selectedQueryKey: null,
      queryKeyToBeRemoved: "",
      showSaveQueryModal: false,
      showConfirmDeleteModal: false,
      showConfirmOverwriteModal: false,
      newQueryName: "",
      isOverlayResultsChecked: false
    });
  }

  onChange = evt => {
    this.setState({ selectedQuery: evt.target.value, selectedQueryKey: null, selectedQueryMultiline: evt.target.value });
    const count = evt.target.value.split("").filter(c => c === "\n").length;
    this.setState({ rowCount: count + 1, multilineHolder: count !== 0, multiline: count !== 0 });
  }

  onFocusGained = () => {
    if (this.state.multilineHolder) {
      this.setState(prevState => ({ selectedQuery: prevState.selectedQueryMultiline, multiline: true }));
    }
  }

  onFocusLost = () => {
    this.setState(prevState => ({ disabled: true, multiline: false, selectedQuery: prevState.selectedQueryMultiline.replaceAll("\n", " ") }));
  }

  onMouseOver = () => {
    this.setState({ disabled: false });
  }

  onChangeQueryName = evt => {
    this.setState({ newQueryName: evt.target.value });
  }

  executeQuery = event => {
    if (typeof this.props.onQueryExecuted === "function") {
      this.props.onQueryExecuted();
    }
    event.preventDefault();
    print(`Requested query: ${this.state.selectedQuery}`);
    eventService.publishQuery(this.state.selectedQuery);
  }

  saveQueryButtonClicked = () => {
    this.setState({ showSaveQueryModal: true });
  }

  saveQuery = e => {
    e.preventDefault();
    const { queries, selectedQuery, newQueryName } = this.state;
    if (newQueryName) {
      const newQueries = [ ...queries ];
      if (queries.find(q => q.name === newQueryName)) {
        this.setState({ showSaveQueryModal: false, showConfirmOverwriteModal: true });
      } else {
        newQueries.push({ name: newQueryName, query: selectedQuery });
        this.setState({ queries: newQueries, selectedQueryKey: newQueryName, showSaveQueryModal: false, newQueryName: "" });
        settingsService.queries = newQueries;
      }
    }
  }

  overwriteQuery = e => {
    e.preventDefault();
    const { queries, selectedQuery, newQueryName } = this.state;
    if (newQueryName) {
      const newQueries = [ ...queries ];
      newQueries[newQueries.indexOf(newQueries.find(q => q.name === newQueryName))] = { name: newQueryName, query: selectedQuery };
      this.setState({ queries: newQueries, selectedQueryKey: newQueryName, showConfirmOverwriteModal: false, newQueryName: "" });
      settingsService.queries = newQueries;
    }
  }

  cancelSaveQuery = e => {
    e.preventDefault();
    this.setState({ showSaveQueryModal: false, newQueryName: "", showConfirmOverwriteModal: false });
  }

  onSelectedQueryChange = (e, i) => {
    this.setState(prevState => ({ selectedQuery: prevState.queries.find(q => q.name === i.key).query, selectedQueryKey: i.key }));
  }

  confirmDeleteQuery = e => {
    e.preventDefault();
    this.removeQuery();
    this.setState({ showConfirmDeleteModal: false, queryKeyToBeRemoved: "" });
  }

  cancelDeleteQuery = e => {
    e.preventDefault();
    this.setState({ showConfirmDeleteModal: false, queryKeyToBeRemoved: "" });
  }

  onRemoveQueryClick = item => {
    this.setState({ showConfirmDeleteModal: true, queryKeyToBeRemoved: item.key });
  }

  removeQuery = () => {
    const { queries } = this.state;
    const newQueries = [ ...queries ];
    newQueries.splice(newQueries.indexOf(newQueries.find(q => q.name === this.state.queryKeyToBeRemoved)), 1);

    this.setState({ queries: newQueries });
    settingsService.queries = newQueries;
  }

  onRenderOption = item => (
    <div className="dropdown-option">
      <span>{item.key}</span>
      <button tabIndex="0" type="button" onClick={() => this.onRemoveQueryClick(item)}>
        <Icon
          className="close-icon"
          iconName="ChromeClose"
          aria-hidden="true"
          aria-label={`Remove query ${item.key}`}
          role="button"
          title="Remove query"
          tabIndex="0" />
      </button>
    </div>)

  onOverlayResultsChange = (e, checked) => {
    this.setState({ isOverlayResultsChecked: !!checked });
    eventService.publishOverlayQueryResults(!!checked);
  };

  handleOverlayResultsKeyUp = e => {
    if (e.keyCode === ENTER_KEY_CODE) {
      eventService.publishOverlayQueryResults(!this.state.isOverlayResultsChecked);
      this.setState(prevState => ({ isOverlayResultsChecked: !prevState.isOverlayResultsChecked }));
    }
  }

  render() {
    const { queries, selectedQuery, selectedQueryKey, showSaveQueryModal, newQueryName,
      showConfirmDeleteModal, showConfirmOverwriteModal, isOverlayResultsChecked, disabled, multiline, rowCount, isFocused } = this.state;

    return (
      <>
        <div className="qc-grid">
          <div className="qc-queryBox">
            <div className="qc-label">
              <Dropdown
                placeholder={this.props.t("queryComponent.savedQueries")}
                ariaLabel={this.props.t("queryComponent.savedQueries")}
                selectedKey={selectedQueryKey}
                options={queries.map(q => ({ key: q.name, text: q.name }))}
                onRenderOption={this.onRenderOption}
                onKeyDown={this.onMouseOver}
                role="combobox"
                styles={{
                  dropdown: { width: 200 }
                }}
                onChange={this.onSelectedQueryChange} onFocus={this.onFocusOther} />
            </div>
            <FocusZone handleTabKey={FocusZoneTabbableElements.all} defaultActiveElement="#queryField">
              <form onSubmit={this.executeQuery}>
                <TextField id="queryField" className="qc-query" styles={this.getStyles} role="search" value={selectedQuery} onChange={this.onChange} ariaLabel="Enter a query"
                  onFocus={this.onFocusGained} multiline={multiline} rows={rowCount} autoAdjustHeight="true" isFocused={isFocused} onBlur={this.onFocusLost} disabled={disabled}
                  onMouseOver={this.onMouseOver} onKeyDown={this.onKeyFunction} ref={input => {
                    this.queryField = input;
                  }} />
              </form>
            </FocusZone>
            <div className="qc-queryControls">
              <FocusZone onKeyUp={this.handleOverlayResultsKeyUp} onKeyDown={this.onMouseOver} >
                <Checkbox label={this.props.t("queryComponent.overlayResults")} checked={isOverlayResultsChecked} onChange={this.onOverlayResultsChange}
                  boxSide="end" />
              </FocusZone>
              <DefaultButton className="query-button" onClick={this.executeQuery} ariaLive="assertive">
                {this.props.t("queryComponent.defaultButton")}
              </DefaultButton>
              <IconButton className="query-save-button"
                iconProps={{ iconName: this.props.t("queryComponent.iconButton"), style: { color: "black" } }}
                title={this.props.t("queryComponent.iconButton")} ariaLabel="Save query" ariaLive="assertive"
                onClick={this.saveQueryButtonClicked} />
            </div>
          </div>
        </div>
        <SaveQueryDialogComponent isVisible={showSaveQueryModal}
          onConfirm={this.saveQuery} onCancel={this.cancelSaveQuery}
          onChange={this.onChangeQueryName} query={newQueryName} />
        <ConfirmQueryDialogComponent title={this.props.t("queryComponent.confirmQueryDialogComponent1.title")}
          description={this.props.t("queryComponent.confirmQueryDialogComponent1.description")}
          action="Confirm" isVisible={showConfirmOverwriteModal}
          onConfirm={this.overwriteQuery} onCancel={this.cancelSaveQuery}
          defaultActiveElementId="deleteQueryField" />
        <ConfirmQueryDialogComponent title={this.props.t("queryComponent.confirmQueryDialogComponent2.title")}
          action="Delete" isVisible={showConfirmDeleteModal}
          onConfirm={this.confirmDeleteQuery} onCancel={this.cancelDeleteQuery} />
      </>
    );
  }

}

export default withTranslation()(QueryComponent);
