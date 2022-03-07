// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, DefaultButton, Dropdown, IconButton, MessageBar, MessageBarType } from "office-ui-fabric-react";
import { v4 as uuidv4 } from "uuid";
import { withTranslation } from "react-i18next";

import ModalComponent from "../../ModalComponent/ModalComponent";
import { apiService } from "../../../services/ApiService";

import "../GraphViewerComponentShared.scss";
import { eventService } from "../../../services/EventService";
import { ModelService } from "../../../services/ModelService";

const swapIconName = "SwapRelationship";
class GraphViewerRelationshipCreateComponent extends Component {

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

  onSelectedRelChange = (e, i) => {
    this.setState({ relationshipId: i.key, hasRequiredRelError: false });
  }

  save = async () => {
    const { onCreate } = this.props;
    const { relationshipId, relationshipItems, sourceId, targetId } = this.state;
    if (relationshipId === null) {
      this.setState({ hasRequiredRelError: true });
    } else {
      this.setState({ isLoading: true });
      try {
        const id = uuidv4();
        const rel = relationshipItems[relationshipId];
        await apiService.addRelationship(sourceId, targetId, rel, id);
        if (onCreate) {
          onCreate({ $sourceId: sourceId, $relationshipId: id, $relationshipName: rel, $targetId: targetId });
        }
      } catch (exc) {
        exc.customMessage = this.props.t("graphViewerRelationshipCreateComponent.creationError");
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
    const { sourceModelId } = this.state;
    this.setState({ showModal: true, isLoading: true });

    try {
      const { selectedNode, selectedNodes } = this.props;
      const source = selectedNodes.find(x => x.id !== selectedNode.id);
      const target = selectedNode;
      this.setState({ sourceId: source.id, targetId: target.id });
      const relationshipItems = await new ModelService().getRelationships(source.modelId, target.modelId);
      this.setState({ hasRelationships: relationshipItems.length > 0, relationshipItems });
    } catch (exc) {
      this.setState({ relationshipItems: [] });
      exc.customMessage = `${this.props.t("graphViewerRelationshipCreateComponent.retrievingError")} ${sourceModelId}`;
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false });
  }

  swap = async () => {
    this.setState(({ hasSwapExecuted }) => ({ hasSwapExecuted: !hasSwapExecuted }));
    const { sourceModelId, hasSwapExecuted } = this.state;
    this.setState({ isLoading: true });
    try {
      const { selectedNode, selectedNodes } = this.props;
      let source = selectedNodes.find(x => x.id !== selectedNode.id);
      let target = selectedNode;
      if (hasSwapExecuted) {
        source = selectedNode;
        target = selectedNodes.find(x => x.id !== selectedNode.id);
      }
      this.setState({ sourceId: source.id, targetId: target.id });
      const relationshipItems = await new ModelService().getRelationships(source.modelId, target.modelId);
      this.setState({ hasRelationships: relationshipItems.length > 0, relationshipItems });
    } catch (exc) {
      this.setState({ relationshipItems: [] });
      exc.customMessage = `${this.props.t("graphViewerRelationshipCreateComponent.retrievingError")} ${sourceModelId}`;
      eventService.publishError(exc);
    }
    this.setState({ isLoading: false });
  }

  render() {
    const { relationshipItems, relationshipId, isLoading, showModal, hasRequiredRelError, sourceId, targetId, hasRelationships } = this.state;

    return (
      <ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
        <h2 className="heading-2" tabIndex="0" id="create-relationship-heading">Create Relationship</h2>
        <h4>Source ID</h4>
        <TextField disabled readOnly id="sourceIdField" ariaLabel="Source ID" className="modal-input" styles={this.getStyles} value={sourceId} />
        <div className="btn-icon">
          <IconButton iconOnly="true" iconProps={{ iconName: swapIconName }} title={this.props.t("graphViewerRelationshipCreateComponent.swapRelationship")}
            ariaLabel={this.props.t("graphViewerRelationshipCreateComponent.swapRelationship")} onClick={this.swap} />
        </div>
        <h4>Target ID</h4>
        <TextField disabled readOnly id="targetIdField" ariaLabel="Target ID" className="modal-input" styles={this.getStyles} value={targetId} />
        <h4>Relationship</h4> {
          hasRelationships && <div>
            <Dropdown
              tabIndex="0"
              ariaLabel={this.props.t("graphViewerRelationshipCreateComponent.optionSelection")}
              required
              placeholder={this.props.t("graphViewerRelationshipCreateComponent.optionSelection")}
              className="modal-input"
              selectedKey={relationshipId}
              options={relationshipItems.map((q, i) => ({ key: i, text: q }))}
              styles={{
                dropdown: { width: 208 }
              }}
              errorMessage={hasRequiredRelError ? this.props.t("graphViewerRelationshipCreateComponent.selectRelationship") : null}
              onChange={this.onSelectedRelChange} />
          </div>
        }
        { !hasRelationships && <div className="div-MessageBar-Relationship"><MessageBar
          aria-label={this.props.t("graphViewerRelationshipCreateComponent.warningRelationship")}
          className="ms-MessageBar-Relationship"
          messageBarType={MessageBarType.error}
          role="alert"
          styles={{
            root: {
              position: "absolute",
              top: 0,
              zIndex: 1
            }
          }}
          isMultiline>
          {this.props.t("graphViewerRelationshipCreateComponent.warningMessage")}
        </MessageBar></div>}
        <div className="btn-group">
          <DefaultButton className="modal-button save-button" onClick={this.save} disabled={!hasRelationships}>Save</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel}>Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}

export default withTranslation("translation", { withRef: true })(GraphViewerRelationshipCreateComponent);
