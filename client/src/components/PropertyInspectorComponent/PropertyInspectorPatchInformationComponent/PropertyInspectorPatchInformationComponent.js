// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import Prism from "prismjs";
import ModalComponent from "../../ModalComponent/ModalComponent";

export class PropertyInspectorPatchInformationComponent extends Component {

  componentDidMount() {
    Prism.highlightAll();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isVisible !== this.props.isVisible && this.props.isVisible) {
      Prism.highlightAll();
    }
  }

  render() {
    const { isVisible, patch, onCloseModal } = this.props;
    return (
      <ModalComponent isVisible={isVisible} className="pi-patch-modal">
        <h2 className="heading-2">Patch Information</h2>
        <div className="patch-json-data">
          <pre>
            <code className="language-js">
              {JSON.stringify(patch, null, 2)}
            </code>
          </pre>
        </div>
        <div className="btn-group">
          <DefaultButton className="modal-button close-button" onClick={onCloseModal}>Close</DefaultButton>
        </div>
      </ModalComponent>
    );
  }

}
