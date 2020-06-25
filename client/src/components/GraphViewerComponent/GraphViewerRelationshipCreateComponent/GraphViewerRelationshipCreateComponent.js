// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, Dropdown } from "office-ui-fabric-react";
import { v4 as uuidv4 } from "uuid";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";
import { print } from "../../../services/LoggingService";

import "../GraphViewerComponentShared.scss";
import { eventService } from "../../../services/EventService";
import { ModelService } from "../../../services/ModelService";

export class GraphViewerRelationshipCreateComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      relationshipItems: [],
      relationshipId: null
    };
  }

  getStyles = props => {
    const { required } = props;
    return {
      fieldGroup: [
        { height: "20px" },
        required && {
          fontSize: "10px",
          borderColor: "lightgray"
        }
      ],
      subComponentStyles: {
        label: this.getLabelStyles
      }
    };
  }

  getLabelStyles = props => {
    const { required } = props;
    return {
      root: [
        required && {
          fontSize: "10px"
        }
      ]
    };
  }

  onSelectedRelChange = (e, i) => {
    this.setState({ relationshipId: i.key });
  }

  save = async () => {
    const { onCreate } = this.props;
    const { relationshipId, relationshipItems } = this.state;
    const { sourceId, targetId } = this.getNodes();

    this.setState({ isLoading: true });
    try {
      const id = uuidv4();
      const rel = relationshipItems[relationshipId];
      await apiService.addRelationship(sourceId, targetId, rel, id);
      if (onCreate) {
        onCreate({ $sourceId: sourceId, $relationshipId: id, $relationshipName: rel, $targetId: targetId });
      }
    } catch (exc) {
      print(`*** Error creating relationship: ${exc}`, "error");
      eventService.publishError(`*** Error creating relationship: ${exc}`);
    }

    this.setState({ isLoading: false, showModal: false });
  }

  cancel = () => {
    const { onCreate } = this.props.onCreate;
    if (onCreate) {
      onCreate();
    }

    this.setState({ showModal: false });
  }

  open = async () => {
    this.setState({ showModal: true, isLoading: true });

    const { selectedNode, selectedNodes } = this.props;
    const sourceModelId = selectedNodes.find(x => x.id !== selectedNode.id).modelId;
    const targetModelId = selectedNode.modelId;

    try {
      const relationshipItems = await new ModelService().getRelationships(sourceModelId, targetModelId);
      this.setState({ relationshipItems });
    } catch (exp) {
      this.setState({ relationshipItems: [] });
      print(`Error in retrieving model. Requested ${sourceModelId}. Exception: ${exp}`, "error");
      eventService.publishError(`Error in retrieving model. Requested ${sourceModelId}. Exception: ${exp}`);
    }

    this.setState({ isLoading: false });
  }

  getNodes() {
    const { selectedNode, selectedNodes } = this.props;
    const source = selectedNodes && selectedNodes.find(x => x.id !== selectedNode.id);
    const sourceId = source ? source.id : "";
    const targetId = selectedNode ? selectedNode.id : "";

    return { sourceId, targetId };
  }

  render() {
    const { relationshipItems, relationshipId, isLoading, showModal } = this.state;
    const { sourceId, targetId } = this.getNodes();

    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2">Create Relationship</h2>
        <h4>Source ID</h4>
        <TextField disabled readOnly id="sourceIdField" className="modal-input" styles={this.getStyles} value={sourceId} />
        <h4>Target ID</h4>
        <TextField disabled readOnly id="targetIdField" className="modal-input" styles={this.getStyles} value={targetId} />
        <h4>Relationship</h4>
        <Dropdown
          required
          placeholder="Select an option"
          className="modal-input"
          selectedKey={relationshipId}
          options={relationshipItems.map((q, i) => ({ key: i, text: q }))}
          styles={{
            dropdown: { width: 208 }
          }}
          onChange={this.onSelectedRelChange} />
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.save}>Save</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
