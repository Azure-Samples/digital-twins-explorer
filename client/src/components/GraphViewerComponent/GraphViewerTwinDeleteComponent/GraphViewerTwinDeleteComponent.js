// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "../GraphViewerComponentShared.scss";

export class GraphViewerTwinDeleteComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false
    };
  }

  async deleteTwin(id) {
    print(`*** Deleting twin ${id}`, "info");
    try {
      await apiService.deleteTwin(id);
    } catch (exc) {
      print(`*** Error deleting twin: ${exc}`, "error");
      eventService.publishError(`*** Error deleting twin: ${exc}`);
    }
  }

  async deleteSelected() {
    const { onDelete, selectedNode, selectedNodes } = this.props;
    this.setState({ isLoading: true });

    if (selectedNodes.length > 1) {
      for (let i = 0; i < selectedNodes.length; i++) {
        await this.deleteTwin(selectedNodes[i].id);
      }
    } else if (selectedNode && selectedNode.id) {
      await this.deleteTwin(selectedNode.id);
    }

    if (onDelete) {
      const ids = selectedNodes.length > 1 ? selectedNodes.map(node => node.id) : [ selectedNode.id ];
      onDelete(ids);
    }

    this.setState({ isLoading: false });
  }

  open() {
    const { selectedNode } = this.props;
    if (!selectedNode) {
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
