// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";

import ModalComponent from "../../ModalComponent/ModalComponent";

import "./ModelViewerUpdateModelImageComponent.scss";

export class ModelViewerUpdateModelImageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      item: null
    };
  }

  open(item) {
    this.setState({ item, showModal: true });
  }

  cancel = () => {
    this.setState({ showModal: false });
  }

  getStyles = () => ({
    fieldGroup: [
      { height: "32px" }
    ]
  })

  update = () => {
    const { item } = this.state;
    this.props.onReplace(item);
    this.setState({ showModal: false });
  }

  delete = () => {
    const { item } = this.state;
    this.props.onDelete(item);
    this.setState({ showModal: false });
  }

  render() {
    const { showModal } = this.state;
    return (
      <ModalComponent isVisible={showModal} className="mv-delete">
        <h2 className="heading-2">Model Image</h2>
        <div className="btn-group">
          <DefaultButton className="modal-button confirm-button" onClick={this.update} data-testid="updateModelImage">Replace</DefaultButton>
          <DefaultButton className="modal-button confirm-button" onClick={this.delete} data-testid="deleteModelImage">Delete</DefaultButton>
          <DefaultButton className="modal-button cancel-button" onClick={this.cancel} data-testid="cancel">Cancel</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
