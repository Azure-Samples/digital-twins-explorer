// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { eventService } from "../../services/EventService";

import "./ErrorMessage.scss";

class ErrorMessageBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      incomatibleLangauageVersion: false
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      if (
        (exc?.name === "DocumentParseError"
                    && exc?.innerError?.details?.url === "dtmi:dtdl:context;3")
                || exc?.message === "Invalid context. context is undefined"
      ) {
        this.setState({
          incomatibleLangauageVersion: true
        });
      }
    });
  }

  render() {
    const { incomatibleLangauageVersion } = this.state;
    if (incomatibleLangauageVersion) {
      // Just show a warning that v3 isn't fully supported at this time.
      return (
        <div
          style={{
            display: "block",
            width: "100vw",
            marginLeft: "0",
            marginRight: "0",
            textAlign: "center",
            backgroundColor: "darkOrange",
            fontWeight: "bold"
          }}>
          {this.props.t("errorMessages.incompatibleLanguageVersion")}
        </div>
      );
    }
    return (<div />);
  }

}

export default withTranslation("translation", { withRef: true })(ErrorMessageBar);
