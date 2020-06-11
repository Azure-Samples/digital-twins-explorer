import React from "react";
import { DefaultButton } from "office-ui-fabric-react";
import { syntaxHighlight } from "../../../utils/utilities";
import ModalComponent from "../../ModalComponent/ModalComponent";

export const PropertyInspectorPatchInformationComponent = ({ isVisible, patch, onCloseModal }) => {
  const getMarkup = p => ({ __html: syntaxHighlight(p || "[]") });

  return (
    <ModalComponent isVisible={isVisible} className="pi-patch-modal">
      <h2 className="heading-2">Patch Information</h2>
      <pre dangerouslySetInnerHTML={getMarkup(patch)} />
      <div className="btn-group">
        <DefaultButton className="modal-button close-button" onClick={onCloseModal}>Close</DefaultButton>
      </div>
    </ModalComponent>
  );
};
