// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import jsonMarkup from "json-markup";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";
import { REL_TYPE_INCOMING } from "../../../services/Constants";

import "./GraphViewerRelationshipViewerComponent.scss";

export class GraphViewerRelationshipViewerComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      outgoingRelationships: null,
      incomingRelationships: null,
      showModal: false
    };
  }

  componentDidUpdate() {
    const { outgoingRelationships, incomingRelationships } = this.state;

    if (!!outgoingRelationships && !!incomingRelationships) {
      this.onFinishLoading();
    }
  }

  onFinishLoading = () => {
    const { isLoading } = this.state;
    if (isLoading) {
      this.setState({ isLoading: false });
    }
  }

  getMarkup(relationships) {
    return { __html: jsonMarkup(relationships || {}) };
  }

  async open() {
    const { selectedNode } = this.props;
    if (!selectedNode) {
      return;
    }

    this.setState({ isLoading: true, showModal: true });
    await this.getOutgoingRelationships(selectedNode.id);
    await this.getIncomingRelationships(selectedNode.id);
  }

  async getOutgoingRelationships(nodeId) {
    print(`Outgoing relationships for ${nodeId}`, "warning");
    let outgoingRelationships = null;
    try {
      outgoingRelationships = await apiService.queryRelationships(nodeId);
    } catch (exc) {
      exc.customMessage = `Error in retrieving outgoing relationships for ${nodeId}`;
      eventService.publishError(exc);
    }
    this.setState({ outgoingRelationships });
  }

  async getIncomingRelationships(nodeId) {
    print(`Incoming relationships for ${nodeId}`, "warning");
    let incomingRelationships = null;
    try {
      incomingRelationships = await apiService.queryRelationships(nodeId, REL_TYPE_INCOMING);
    } catch (exc) {
      exc.customMessage = `Error in retrieving incoming relationships for ${nodeId}`;
      eventService.publishError(exc);
    }
    this.setState({ incomingRelationships });
  }

  close = () => {
    this.setState({
      showModal: false,
      outgoingRelationships: null,
      incomingRelationships: null
    });
  }

  render() {
    const { incomingRelationships, outgoingRelationships, isLoading, showModal } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-relationship-view-modal">
        <h2 className="heading-2">Relationship Information</h2>
        <div className="modal-scroll">
          {!!incomingRelationships
          && incomingRelationships.length > 0
          && <div>
            <h3>Incoming</h3>
            <pre dangerouslySetInnerHTML={this.getMarkup(incomingRelationships)} />
          </div>}

          {!!outgoingRelationships
          && outgoingRelationships.length > 0
          && <div>
            <h3>Outgoing</h3>
            <pre dangerouslySetInnerHTML={this.getMarkup(outgoingRelationships)} />
          </div>}
        </div>
        <div className="btn-group">
          <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
