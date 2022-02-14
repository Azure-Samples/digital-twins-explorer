// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";

import "../GraphViewerComponentShared.scss";

class GraphViewerRelationshipDeleteComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      isLoading: false
    };
  }

  async deleteSelected() {
    const { selectedEdges } = this.props;
    if (selectedEdges) {
      this.setState({ isLoading: true });
      await Promise.all(selectedEdges.map(this.deleteRelationship));
      this.setState({ isLoading: false });
    }
  }

  async deleteRelationship(edge) {
    try {
      const { source, relationshipId } = edge;
      print(`*** Deleting relationship ${relationshipId}`, "info");
      await apiService.deleteRelationship(source, relationshipId);
      eventService.publishDeleteRelationship({ $sourceId: source, $relationshipId: relationshipId });
    } catch (exc) {
      exc.customMessage = "Error deleting relationship";
      eventService.publishError(exc);
    }
  }

  open() {
    const { selectedEdges } = this.props;
    if (!selectedEdges || selectedEdges.length === 0) {
      return;
    }

    this.setState({ showModal: true }, () => {
      setTimeout(() => {
        document.getElementById("delete-relationship-button").focus();
      }, 200);
    });
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
        <h2 className="heading-2">{this.props.t("graphViewerRelationshipDeleteComponent.heading")}</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.confirm} id="delete-relationship-button">Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}

export default withTranslation("translation", { withRef: true })(GraphViewerRelationshipDeleteComponent);
