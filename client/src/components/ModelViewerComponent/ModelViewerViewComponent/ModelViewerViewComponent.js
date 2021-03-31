// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, FocusZone, FocusZoneTabbableElements } from "office-ui-fabric-react";
import Prism from "prismjs";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";

import "./ModelViewerViewComponent.scss";

export class ModelViewerViewComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showModal: false,
      model: null
    };
  }

  async open(item) {
    this.setState({ showModal: true, isLoading: true, model: null });

    let data = {};
    try {
      data = await apiService.getModelById(item.key);
    } catch (exp) {
      print(`Error in retrieving model. Requested ${item.key}. Exception: ${exp}`, "error");
    }

    this.setState({ model: data.model ? data.model : data, isLoading: false }, () => {
      Prism.highlightAll();
    });
  }

  close = e => {
    e.preventDefault();
    this.setState({ showModal: false });
  }

  render() {
    const { model, showModal, isLoading } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="mv-model-view-modal">
        <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#close-model-btn">
          <form onSubmit={this.close}>
            <h2 className="heading-2">Model Information</h2>
            <div className="pre-wrapper modal-scroll">
              {model && <pre>
                <code className="language-json">
                  {JSON.stringify(model, null, 1)}
                </code>
              </pre>}
            </div>
            <div className="btn-group">
              <DefaultButton id="close-model-btn" className="modal-button close-button" type="submit" onClick={this.close}>
                Close
              </DefaultButton>
            </div>
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
