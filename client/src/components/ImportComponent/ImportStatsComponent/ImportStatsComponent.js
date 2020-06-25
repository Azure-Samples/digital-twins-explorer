// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { DefaultButton } from "office-ui-fabric-react";
import ModalComponent from "../../ModalComponent/ModalComponent";

const ImportStatsComponent = props => {
  const { isVisible, onClose, data } = props;
  if (data) {
    const twins = data.digitalTwinsGraph && data.digitalTwinsGraph.digitalTwins ? data.digitalTwinsGraph.digitalTwins : [];
    const relationships = data.digitalTwinsGraph && data.digitalTwinsGraph.relationships ? data.digitalTwinsGraph.relationships : [];
    const models = data.digitalTwinsModels ? data.digitalTwinsModels : [];
    return (
      <ModalComponent isVisible={isVisible} className="import-stats-modal">
        <div className="message-container">
          <h2 className="heading-2">Import Successful</h2>
          {models.length > 0 && <p>{`${models.length} models imported`}</p>}
          {twins.length > 0 && <p>{`${twins.length} twins imported`}</p>}
          {relationships.length > 0 && <p>{`${relationships.length} relationships imported`}</p>}
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={onClose}>Close</DefaultButton>
          </div>
        </div>
      </ModalComponent>
    );
  }

  return null;
};

export default ImportStatsComponent;
