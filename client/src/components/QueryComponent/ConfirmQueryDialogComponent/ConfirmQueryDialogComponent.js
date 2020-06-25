// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { DefaultButton, PrimaryButton, FocusZone, FocusZoneTabbableElements } from "office-ui-fabric-react";
import ModalComponent from "../../ModalComponent/ModalComponent";

export const ConfirmQueryDialogComponent = ({ title, description, action, isVisible, onConfirm, onCancel, defaultActiveElementId }) =>
  (
    <ModalComponent isVisible={isVisible} className="qc-confirm-delete">
      <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement={`#${defaultActiveElementId}`}>
        <form onSubmit={onConfirm}>
          <h2 className="heading-2">{title}</h2>
          {description && <p>{description}</p>}
          <div className="btn-group">
            <PrimaryButton type="submit" id={defaultActiveElementId} className="modal-button save-button" onClick={onConfirm}>
              {action}
            </PrimaryButton>
            <DefaultButton className="modal-button cancel-button" onClick={onCancel}>Cancel</DefaultButton>
          </div>
        </form>
      </FocusZone>
    </ModalComponent>
  );
