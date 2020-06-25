// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, PrimaryButton, FocusZone, FocusZoneTabbableElements } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { ModelService } from "../../../services/ModelService";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "./ModelViewerCreateComponent.scss";

export class ModelViewerCreateComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false,
      name: "",
      error: "",
      item: null
    };
  }

  open(item) {
    this.setState({ item, showModal: true, name: "", error: "" });
  }

  cancel = e => {
    e.preventDefault();
    this.setState({ showModal: false });
  }

  onNameChange = evt => {
    this.setState({ name: evt.target.value });
  }

  getStyles = () => ({
    fieldGroup: [
      { height: "32px" }
    ]
  })

  save = async e => {
    e.preventDefault();
    const { name, item } = this.state;
    if (name === "") {
      this.setState({ error: "Please enter a value." });
      return;
    }

    this.setState({ isLoading: true });
    try {
      print(`*** Creating a twin instance`, "info");
      const model = await apiService.getModelById(item.key);

      const payload = new ModelService().createPayload(model.model["@id"]);
      print("Generated model payload:", "info");
      print(JSON.stringify(payload, null, 2), "info");

      const twinResult = await apiService.addTwin(name, payload);
      print("*** Creation result:", "info");
      print(JSON.stringify(twinResult, null, 2), "info");

      eventService.publishCreateTwin({ $dtId: name, $metadata: { $model: item.key } });
    } catch (exc) {
      print(`*** Error in instance creation: ${exc}`, "error");
      eventService.publishError(`*** Error in instance creation: ${exc}`);
    }

    this.setState({ showModal: false, isLoading: false });
  }

  render() {
    const { showModal, name, error, isLoading } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="mv-create">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#outlined-required">
          <form onSubmit={this.save}>
            <h2 className="heading-2">New Twin Name</h2>
            <TextField required errorMessage={error} id="outlined-required" className="name-input" styles={this.getStyles}
              value={name} onChange={this.onNameChange} autoFocus />
            <div className="btn-group">
              <PrimaryButton type="submit" className="modal-button save-button" onClick={this.save}>Save</PrimaryButton>
              <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
            </div>
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
