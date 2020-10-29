// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "../GraphViewerComponentShared.scss";

export class GraphViewerRelationshipDeleteComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false
    };
  }

  async deleteSelected() {
    const { selectedEdge } = this.props;
    const { source } = selectedEdge;
    let { id } = selectedEdge;
    id = id.split("_").pop();
    this.setState({ isLoading: true });
    print(`*** Deleting relationship ${id}`, "info");
    try {
      await apiService.deleteRelationship(source, id);
      eventService.publishDeleteRelationship({ $sourceId: source, $relationshipId: id });
    } catch (exc) {
      exc.customMessage = "Error deleting relationship";
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false });
  }

  open() {
    const { selectedEdge } = this.props;
    if (!selectedEdge) {
      return;
    }

    this.setState({ showModal: true });
  }

  confirm = async () => {
    await this.deleteSelected();
    this.setState({ showModal: false });
  }

  cancel = () => {
    this.setState({ showModal: false });
  }

  render() {
    const { showModal, isLoading } = this.state;
    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2">Are you sure?</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.confirm}>Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
