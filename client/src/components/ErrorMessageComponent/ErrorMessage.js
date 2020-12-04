// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, Spinner } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE, AUTH_CONFLICT_MESSAGE } from "../../services/Constants";
import { print } from "../../services/LoggingService";
import { apiService } from "../../services/ApiService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      showFixAuth: ""
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let auth = "";
      // Service does not return an error code - only a name
      if (exc && exc.name === "RestError" && !exc.code) {
        console.log(exc);
        message = CUSTOM_AUTH_ERROR_MESSAGE;
        auth = <DefaultButton className="modal-button close-button" onClick={this.fixPermissions} style={{width:150}}>Assign yourself data reader access</DefaultButton>;
      } else {
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
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
      this.setState({showFixAuth: <Spinner/>});
      apiService.addReaderRBAC().then(requestParams => 
        {
          for(var i in requestParams){
            if(requestParams[i]){
              switch(requestParams[i].status){
                case 201:
                  this.setState({showFixAuth: <p style={{color:"green", "text-align":"left", width:400, margin:0}}>{AUTH_SUCCESS_MESSAGE}</p>});
                  break;
                case 409:
                  this.setState({showFixAuth: <p>{AUTH_CONFLICT_MESSAGE}</p>});
                  break;
                default:
                  this.setState({showFixAuth: <p>{requestParams[i].statusText}</p>});
              }
            }
          }
      });
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
            {showFixAuth}
          </div>
        </div>
      </ModalComponent>
    );
  }

}
