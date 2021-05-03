// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";

import { apiService } from "../../../services/ApiService";
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
      eventService.publishDeleteModel(item.key);
    } catch (exc) {
      exc.customMessage = "Error with deleting instance";
      eventService.publishError(exc);
    }

    this.setState({ showModal: false });
  }

  render() {
    const { showModal } = this.state;
    return (
      <ModalComponent isVisible={showModal} className="mv-delete">
        <h2 className="heading-2">{this.props.t("modelViewerDeleteComponent.heading")}</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button confirm-button" onClick={this.delete}>{this.props.t("modelViewerDeleteComponent.confirm")}</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>{this.props.t("modelViewerDeleteComponent.cancel")}</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
