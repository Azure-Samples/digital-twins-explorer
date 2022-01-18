// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, Dropdown, IconButton, Label } from "office-ui-fabric-react";
import { v4 as uuidv4 } from "uuid";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";

import "../GraphViewerComponentShared.scss";
import { eventService } from "../../../services/EventService";
import { ModelService } from "../../../services/ModelService";

export class GraphViewerRelationshipCreateComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      relationshipItems: [],
      relationshipId: null,
      hasRequiredRelError: false,
      hasRelationships: true,
      hasSwapExecuted: true,
      sourceId: "",
      targetId: ""
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

  swapRelationshipIcon =
  {
    iconName: "SwapRelationship"
  }

  warningRelationshipIcon =
  {
    iconName: "WarningRelationship"
  }

  onSelectedRelChange = (e, i) => {
    this.setState({ relationshipId: i.key, hasRequiredRelError: false });
  }

  save = async () => {
    const { onCreate } = this.props;
    const { relationshipId, relationshipItems } = this.state;
    if (relationshipId === null) {
      this.setState({ hasRequiredRelError: true });
    } else {
      this.setState({ isLoading: true });
      try {
        const id = uuidv4();
        const rel = relationshipItems[relationshipId];
        await apiService.addRelationship(this.state.sourceId, this.state.targetId, rel, id);
        if (onCreate) {
          onCreate({ $sourceId: this.state.sourceId, $relationshipId: id, $relationshipName: rel, $targetId: this.state.targetId });
        }
      } catch (exc) {
        exc.customMessage = "Error creating relationship";
        eventService.publishError(exc);
      }
      this.setState({ isLoading: false, showModal: false });
    }
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
    setTimeout(() => {
      document.getElementById("create-relationship-heading").focus();
    }, 200);

    try {
      const { selectedNode, selectedNodes } = this.props;
      const source = selectedNodes.find(x => x.id !== selectedNode.id);
      const target = selectedNode;
      this.setState({sourceId: source.id});
      this.setState({targetId: target.id});
      const relationshipItems = await new ModelService().getRelationships(source.modelId, target.modelId);
      if (relationshipItems.length === 0) {
        this.setState({hasRelationships: false});
      } else {
        this.setState({hasRelationships: true});
      }
      this.setState({ relationshipItems });
    } catch (exc) {
      this.setState({ relationshipItems: [] });
      exc.customMessage = `Error in retrieving model. Requested ${this.state.sourceModelId}`;
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false });
  }

  swap = async () => {
    this.setState({ isLoading: true });
    setTimeout(() => {
      document.getElementById("create-relationship-heading").focus();
    }, 200);
    this.setState(({ hasSwapExecuted }) => ({ hasSwapExecuted: !hasSwapExecuted }));

    try {
      const { selectedNode, selectedNodes } = this.props;
      let source = selectedNodes.find(x => x.id !== selectedNode.id);
      let target = selectedNode;
      if (this.state.hasSwapExecuted) {
        source = selectedNode;
        target = selectedNodes.find(x => x.id !== selectedNode.id);
      }
      this.setState({sourceId: source.id});
      this.setState({targetId: target.id});
      const relationshipItems = await new ModelService().getRelationships(source.modelId, target.modelId);
      if (relationshipItems.length === 0) {
        this.setState({hasRelationships: false});
      } else {
        this.setState({hasRelationships: true});
      }
      this.setState({ relationshipItems });
    } catch (exc) {
      this.setState({ relationshipItems: [] });
      exc.customMessage = `Error in retrieving model. Requested ${this.state.sourceModelId}`;
      eventService.publishError(exc);
    }
    this.setState({ isLoading: false });
  }

  render() {
    const { relationshipItems, relationshipId, isLoading, showModal, hasRequiredRelError, sourceId, targetId } = this.state;

    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2" tabIndex="0" id="create-relationship-heading">Create Relationship</h2>
        <h4>Source ID</h4>
        <TextField disabled readOnly id="sourceIdField" ariaLabel="Source ID" className="modal-input" styles={this.getStyles} value={sourceId} />
        <div className="btn-icon" style={{ float: "right" }}>
          <IconButton iconOnly="true" iconProps={this.swapRelationshipIcon} title="Swap Relationship" ariaLabel="Swap Relationship" onClick={this.swap} />
        </div>
        <h4>Target ID</h4>
        <TextField disabled readOnly id="targetIdField" ariaLabel="Target ID" className="modal-input" styles={this.getStyles} value={targetId} />
        <h4>Relationship</h4>
        <div style={{ display: this.state.hasRelationships ? "block" : "none" }}>
          <Dropdown
            tabIndex="0"
            ariaLabel="Select an option"
            required
            placeholder="Select an option"
            className="modal-input"
            selectedKey={relationshipId}
            options={relationshipItems.map((q, i) => ({ key: i, text: q }))}
            styles={{
              dropdown: { width: 208 }
            }}
            errorMessage={hasRequiredRelError ? "Please select a relationship" : null}
            onChange={this.onSelectedRelChange} />
        </div>
        <div style={{ backgroundColor: "red", height: "60px", display: this.state.hasRelationships ? "none" : "block" }}>
          <div style={{ float: "left", marginTop: "15px" }}>
            <IconButton iconOnly="true" iconProps={this.warningRelationshipIcon} title="Warning Relationship" ariaLabel="Warning  Relationship" />
          </div>
          <div style={{ float: "right", backgroundColor: "var(--background-color2)", margin: "1px", width: "200px" }}>
            <Label>No relationship available, try</Label>
            <Label>swapping source and target</Label>
          </div>
        </div>
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.save}>Save</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
