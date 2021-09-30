// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import ModalComponent from "../../ModalComponent/ModalComponent";
import { DefaultButton } from "office-ui-fabric-react";
import { eventService } from "../../../services/EventService";
import { print } from "../../../services/LoggingService";
import { ModelService } from "../../../services/ModelService";

const KEY_ESC = 27;
const KEY_TAB = 9;
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
      eventService.publishClearModelsData();
    } catch (exc) {
      exc.customMessage = "Error deleting models";
      eventService.publishError(exc);
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

  componentDidMount() {
    const handleKeyDown = e => {
      if (e.keyCode === KEY_ESC && this.state.showModal) {
        this.setState({ showModal: false });
        return;
      }

      if (e.keyCode === KEY_TAB) {
        const deleteElement = document.getElementById("modal-delete-cta");
        const cancelElement = document.getElementById("modal-cancel-cta");
        if (deleteElement && cancelElement && document.activeElement.id === cancelElement.id) {
          deleteElement.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", e => {
      handleKeyDown(e);
    });
  }

  render() {
    const { showModal, isLoading } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2">Are you sure?</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.confirm} id="modal-delete-cta">Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel} id="modal-cancel-cta">Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
