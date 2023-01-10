// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { MessageBar, MessageBarType } from "office-ui-fabric-react";
import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { eventService } from "../../services/EventService";

import "./ErrorMessage.scss";
import { isDtdlVersion3 } from "./ErrorMessageHelper";

class ErrorMessageBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      incomatibleLangauageVersion: false,
      showBar: true
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      if (isDtdlVersion3(exc)) {
        this.setState({
          incomatibleLangauageVersion: true
        });
      }
    });
  }

  close = () => {
    eventService.publishHideWarningMessage();
    this.setState({
      showBar: false
    });
  }

  render() {
    const { incomatibleLangauageVersion, showBar } = this.state;
    if (incomatibleLangauageVersion && showBar) {
      // Just show a warning that v3 isn't fully supported at this time.
      return (
        <MessageBar
          messageBarType={MessageBarType.warning}
          isMultiline={false}
          onDismiss={this.close}
          dismissButtonAriaLabel={this.props.t("errorMessages.closeButton")}>
          {this.props.t("errorMessages.incompatibleLanguageVersion")}
        </MessageBar>
      );
    }
    return (<div />);
  }

}

export default withTranslation("translation", { withRef: true })(ErrorMessageBar);
