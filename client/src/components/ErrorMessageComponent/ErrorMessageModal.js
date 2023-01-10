// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, Spinner, MessageBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE, MORE_INFORMATION_LINK, CUSTOM_NOT_FOUND_ERROR_MESSAGE, CUSTOM_AZURE_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE,
  AUTH_CONFLICT_MESSAGE, AUTH_FORBIDDEN_MESSAGE, AUTH_NOT_FOUND_MESSAGE } from "../../services/Constants";
import { print } from "../../services/LoggingService";
import { rbacService} from "../../services/RBACService";
import { configService } from "../../services/ConfigService";

import "./ErrorMessage.scss";
import { isDtdlVersion3 } from "./ErrorMessageHelper";

export class ErrorMessageModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      showFixAuth: false,
      showAuthSpinner: false,
      showAuthStatus: 0,
      showAuthResponse: false,
      stackErrorMessage: "",
      showAdtChinaWarningMessage: false
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let errorMessage = "";
      let auth = false;
      let v3 = false;

      if (isDtdlVersion3(exc)) {
        v3 = true;
      } else if (exc && exc.name === "RestError" && exc.statusCode === 403) {
        errorMessage = CUSTOM_AUTH_ERROR_MESSAGE;
        message = CUSTOM_AUTH_ERROR_MESSAGE;
        auth = true;
      } else if (exc && exc.name === "RestError" && exc.statusCode === 404) {
        errorMessage = CUSTOM_NOT_FOUND_ERROR_MESSAGE;
      } else {
        errorMessage = exc.customMessage ? `${exc.customMessage}` : `${exc.code}`;
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
      }

      print(message, "error");

      this.checkUrl();

      this.setState({
        errorMessage,
        stackErrorMessage: exc.stack ? exc.stack.replace(/\n/g, "<br>").replace(/ /gi, "&nbsp") : null,
        // Don't show modal for v3 dtdl issue
        showModal: !v3,
        showFixAuth: auth
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  checkUrl = async () => {
    const { appAdtUrl } = await configService.getConfig();
    const urlValues = appAdtUrl.split(".");
    const chinaUrl = urlValues.length > 0 && urlValues[urlValues.length - 1] === "cn";
    this.setState({ showAdtChinaWarningMessage: chinaUrl });
  }

  fixPermissions = async () => {
    this.setState(
      {showAuthSpinner: true,
        showFixAuth: false});
    const requestParams = await rbacService.addReaderRBAC();
    this.setState({
      showAuthSpinner: false,
      showAuthResponse: true,
      showAuthStatus: requestParams
    });
  }

  componentDidUpdate() {
    if (this.state.showModal) {
      setTimeout(() => {
        document.getElementById("error-message-header").focus();
      }, 200);
    }
  }

  render() {
    const { showModal, errorMessage, stackErrorMessage, showFixAuth, showAuthSpinner, showAuthStatus, showAuthResponse, showAdtChinaWarningMessage } = this.state;

    let authComponent = "";
    if (showFixAuth) {
      authComponent = <DefaultButton className="modal-button close-button" onClick={this.fixPermissions} style={{width: 150}}>Assign yourself data reader access</DefaultButton>;
    } else if (showAuthSpinner) {
      authComponent = <Spinner />;
    } else if (showAuthResponse && showAuthStatus === false) {
      authComponent = <p style={{margin: 7}}>{CUSTOM_AZURE_ERROR_MESSAGE}</p>;
    } else if (showAuthResponse && showAuthStatus !== 0) {
      authComponent = <p style={{margin: 7}}>{AUTH_NOT_FOUND_MESSAGE}</p>;
      for (const response of showAuthStatus) {
        if (response) {
          switch (response.status) {
            case 201:
              authComponent = <p style={{color: "green", "textAlign": "left", width: 400, margin: 0}}>{AUTH_SUCCESS_MESSAGE}</p>;
              break;
            case 403:
              authComponent = <p style={{margin: 7}}>{AUTH_FORBIDDEN_MESSAGE}</p>;
              break;
            case 409:
              authComponent = <p style={{margin: 7}}>{AUTH_CONFLICT_MESSAGE}</p>;
              break;
            default:
              authComponent = <p>{response.statusText}</p>;
          }
        }
      }
    }
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 tabIndex="0" className="heading-2" id="error-message-header"><span>!</span>{this.props.t("errorMessages.error")}</h2>
          {showAdtChinaWarningMessage && <MessageBar>
            {this.props.t("errorMessages.chinaSupport")}
          </MessageBar>}
          <p tabIndex="0">{errorMessage}</p>
          <p tabIndex="0">Find more information on how to resolve issues like this here: <a href={MORE_INFORMATION_LINK} target="_blank" rel="noopener noreferrer">{MORE_INFORMATION_LINK}</a></p>
          {stackErrorMessage && (
            <div className="error-description">
              <p dangerouslySetInnerHTML={{ __html: stackErrorMessage }} />
            </div>
          )}
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
            {authComponent}
          </div>
        </div>
      </ModalComponent>
    );
  }

}

export default withTranslation("translation", { withRef: true })(ErrorMessageModal);
