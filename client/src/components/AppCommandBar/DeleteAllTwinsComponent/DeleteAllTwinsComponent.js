// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import ModalComponent from "../../ModalComponent/ModalComponent";
import { DefaultButton } from "office-ui-fabric-react";
import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";
import { print } from "../../../services/LoggingService";

export default class DeleteAllTwinsComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false
    };
  }

  async deleteAllTwins() {
    this.setState({ isLoading: true });

    print(`*** Deleting all twins`, "info");
    try {
      const allTwins = await apiService.getAllTwins();
      const ids = allTwins ? allTwins.map(twin => twin.$dtId) : [];
      await apiService.deleteAllTwins(ids);
      eventService.publishClearData();
    } catch (exc) {
      print(`*** Error deleting twins: ${exc}`, "error");
      eventService.publishError(`*** Error deleting twins: ${exc}`);
    }

    this.setState({ isLoading: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  confirm = async () => {
    await this.deleteAllTwins();
    this.setState({ showModal: false });
  }

  cancel = () => {
    this.setState({ showModal: false });
  }

  render() {
    const { showModal, isLoading } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2">Are you sure?</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.confirm}>Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
