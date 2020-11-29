// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE } from "../../services/Constants";
import { print } from "../../services/LoggingService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      showFixAuth: false
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let auth = false;
      // Service does not return an error code - only a name
      if (exc && exc.name === "RestError" && !exc.code) {
        message = CUSTOM_AUTH_ERROR_MESSAGE;
        auth = true;
      } else {
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
        auth = false;
      }

      print(message, "error");

      this.setState({
        errorMessage: message,
        showModal: true,
        showFixAuth: auth
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  fixPermissions = () => {
    console.log("Let's get to implementing this method!");
  }

  render() {
    const { showModal, errorMessage, showFixAuth } = this.state;
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 className="heading-2">Error</h2>
          <p>{errorMessage}</p>
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
            <DefaultButton className="modal-button close-button" onClick={this.fixPermissions} isVisible={this.showFixAuth}>Fix Permissions</DefaultButton>
          </div>
        </div>
      </ModalComponent>
    );
  }

}
