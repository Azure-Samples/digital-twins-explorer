// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import Prism from "prismjs";
import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import "./ModelGraphViewerModelDetailComponent.scss";

export class ModelGraphViewerModelDetailComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      model: null
    };
  }

  async loadModel(modelId) {
    let data = {};
    try {
      data = await apiService.getModelById(modelId);
    } catch (exp) {
      exp.customMessage = `Error in retrieving model. Requested ${modelId}.`;
      eventService.publishError(exp);
    }

    this.setState({ model: data.model ? data.model : data }, () => {
      Prism.highlightAll();
    });
  }

  clear = () => {
    this.setState({ model: null });
  };

  render() {
    const { model } = this.state;
    return (
      <div className="model-detail-prism">
        <div className="detail-title">Model Detail</div>
        {model && (
          <pre tabIndex="0">
            <code className="language-js">
              {JSON.stringify(model, null, 1)}
            </code>
          </pre>
        )}
      </div>
    );
  }

}
