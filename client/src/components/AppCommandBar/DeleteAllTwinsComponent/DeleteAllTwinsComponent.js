// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import ModalComponent from "../../ModalComponent/ModalComponent";
import { DefaultButton } from "office-ui-fabric-react";
import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";
import { print } from "../../../services/LoggingService";

const KEY_ESC = 27;
const KEY_TAB = 9;
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
      eventService.publishClearTwinsData();
    } catch (exc) {
      exc.customMessage = "Error deleting twins";
      eventService.publishError(exc);
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

  componentDidMount() {
    const handleKeyDown = e => {
      if (e.keyCode === KEY_ESC && this.state.showModal) {
        this.setState({ showModal: false });
        return;
      }

      if (e.keyCode === KEY_TAB) {
        const deleteElement = document.getElementById("modal-save-cta--all-twins");
        const cancelElement = document.getElementById("modal-cancel-cta--all-twins");
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
        <h2 className="heading-2">{this.props.t("deleteAllTwinsComponent.heading")}</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.confirm} id="modal-save-cta--all-twins">{this.props.t("deleteAllTwinsComponent.deleteButton")}</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel} id="modal-cancel-cta--all-twins">{this.props.t("deleteAllTwinsComponent.cancelButton")}</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
