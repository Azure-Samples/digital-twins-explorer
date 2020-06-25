// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import ModalComponent from "../../ModalComponent/ModalComponent";
import { DefaultButton } from "office-ui-fabric-react";
import { eventService } from "../../../services/EventService";
import { print } from "../../../services/LoggingService";
import { ModelService } from "../../../services/ModelService";

export default class ModelViewerDeleteAllModelsComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false
    };
  }

  async deleteAllModels() {
    this.setState({ isLoading: true });

    print(`*** Deleting all models`, "info");
    try {
      const modelService = new ModelService();
      await modelService.deleteAll();
      eventService.publishClearData();
    } catch (exc) {
      print(`*** Error deleting models: ${exc}`, "error");
      eventService.publishError(`*** Error deleting models: ${exc}`);
    }

    this.setState({ isLoading: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  confirm = async () => {
    await this.deleteAllModels();
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
