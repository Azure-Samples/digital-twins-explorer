// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { TextField, DefaultButton, PrimaryButton, FocusZone, FocusZoneTabbableElements } from "office-ui-fabric-react";
import ModalComponent from "../../ModalComponent/ModalComponent";

export const SaveQueryDialogComponent = ({ isVisible, onChange, onConfirm, onCancel, query }) => {
  const getLabelStyles = props => {
    const { required } = props;
    return {
      root: [
        required && {
          fontSize: "10px"
        }
      ]
    };
  };

  const getStyles = props => {
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
        label: getLabelStyles
      }
    };
  };

  return (
    <ModalComponent isVisible={isVisible} className="qc-save-query">
      <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation defaultActiveElement="#queryNameField">
        <form onSubmit={onConfirm}>
          <h2 className="heading-2">Save Query</h2>
          <TextField id="queryNameField" className="query-name-input" styles={getStyles} value={query} onChange={onChange}
            required autoFocus />
          <div className="btn-group">
            <PrimaryButton type="submit" className="modal-button save-button" onClick={onConfirm}>Save</PrimaryButton>
            <DefaultButton className="modal-button cancel-button" onClick={onCancel}>Cancel</DefaultButton>
          </div>
        </form>
      </FocusZone>
    </ModalComponent>
  );
};
