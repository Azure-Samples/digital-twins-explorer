// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: ""
    };
  }

  componentDidMount() {
    eventService.subscribeError(error => {
      this.setState({
        errorMessage: error,
        showModal: true
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  render() {
    const { showModal, errorMessage } = this.state;
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 className="heading-2">Error</h2>
          <p>{errorMessage}</p>
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
          </div>
        </div>
      </ModalComponent>
    );
  }

}
