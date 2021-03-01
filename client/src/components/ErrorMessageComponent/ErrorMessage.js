// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE, MORE_INFORMATION_LINK } from "../../services/Constants";
import { print } from "../../services/LoggingService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      stackErrorMessage: ""
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let errorMessage = "";

      // Service does not return an error code - only a name
      if (exc && exc.name === "RestError" && !exc.code) {
        errorMessage = CUSTOM_AUTH_ERROR_MESSAGE;
        message = CUSTOM_AUTH_ERROR_MESSAGE;
      } else {
        errorMessage = exc.customMessage ? `${exc.customMessage}` : `${exc.code}`;
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
      }

      print(message, "error");

      this.setState({
        errorMessage,
        stackErrorMessage: exc.stack ? exc.stack.replace(/\n/g, "<br>").replace(/ /gi, "&nbsp") : null,
        showModal: true
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  render() {
    const { showModal, errorMessage, stackErrorMessage } = this.state;
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 className="heading-2"><span>!</span>Error</h2>
          <p>{errorMessage}</p>
          <p>Find more infomation on how to resolve issues like this here: <a href={MORE_INFORMATION_LINK} target="_blank" rel="noopener noreferrer">{MORE_INFORMATION_LINK}</a></p>
          {stackErrorMessage && (
            <div className="error-description">
              <p dangerouslySetInnerHTML={{ __html: stackErrorMessage }} />
            </div>
          )}
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
          </div>
        </div>
      </ModalComponent>
    );
  }

}
