// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import jsonMarkup from "json-markup";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "./GraphViewerRelationshipViewerComponent.scss";

export class GraphViewerRelationshipViewerComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      relationships: null,
      showModal: false
    };
  }

  getMarkup(relationships) {
    return { __html: jsonMarkup(relationships || {}) };
  }

  async open() {
    const { selectedNode } = this.props;
    if (!selectedNode) {
      return;
    }

    const { id } = selectedNode;
    this.setState({ isLoading: true, showModal: true });

    print(`Relationships for ${id}`, "warning");
    let relationships = null;
    try {
      relationships = await apiService.queryRelationships(id);
    } catch (exp) {
      print(`Error in retrieving relationships for ${id}, exception: ${exp}`, "error");
      eventService.publishError(`Error in retrieving relationships for ${id}, exception: ${exp}`);
    }

    this.setState({ isLoading: false, relationships });
  }

  close = () => {
    this.setState({ showModal: false, relationships: null });
  }

  render() {
    const { relationships, isLoading, showModal } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-relationship-view-modal">
        <h2 className="heading-2">Relationship Information</h2>
        <pre dangerouslySetInnerHTML={this.getMarkup(relationships)} />
        <div className="btn-group">
          <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
