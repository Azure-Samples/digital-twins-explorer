// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "./ModelViewerDeleteComponent.scss";

export class ModelViewerDeleteComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      item: null
    };
  }

  open(item) {
    this.setState({ item, showModal: true });
  }

  cancel = () => {
    this.setState({ showModal: false });
  }

  getStyles = () => ({
    fieldGroup: [
      { height: "32px" }
    ]
  })

  delete = async () => {
    const { item } = this.state;
    try {
      await apiService.deleteModel(item.key);
      this.props.onDelete(item.key);
    } catch (exc) {
      print(`*** Error with deleting instance: ${exc}`, "error");
      eventService.publishError(`*** Error in instance creation: ${exc}`);
    }

    this.setState({ showModal: false });
  }

  render() {
    const { showModal } = this.state;
    return (
      <ModalComponent isVisible={showModal} className="mv-delete">
        <h2 className="heading-2">Are you sure?</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button confirm-button" onClick={this.delete}>Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
