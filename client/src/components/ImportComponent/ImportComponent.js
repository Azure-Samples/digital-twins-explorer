// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";

import { GraphViewerCytoscapeComponent } from "../GraphViewerComponent/GraphViewerCytoscapeComponent/GraphViewerCytoscapeComponent";
import ImportCommandBar from "./ImportCommandBar/ImportCommandBar";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import ImportStatsComponent from "./ImportStatsComponent/ImportStatsComponent";
import { importService } from "../../services/ImportService";
import { eventService } from "../../services/EventService";

import "./ImportComponent.scss";

export class ImportComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: false,
      isLoading: true,
      isComplete: false,
      showImportModal: false,
      dataImported: false
    };
    this.cyRef = React.createRef();
    this.data = null;
  }

  async componentDidMount() {
    const { file } = this.props;

    this.setState({ isLoading: true });
    try {
      this.data = await importService.tryLoad(file);
    } catch (exc) {
      exc.customMessage = "Error in creating graph from file";
      eventService.publishError(exc);
    }

    if (this.data) {
      if (this.data.digitalTwinsGraph) {
        if (this.data.digitalTwinsGraph.digitalTwins) {
          this.cyRef.current.addTwins(this.data.digitalTwinsGraph.digitalTwins);
        }
        if (this.data.digitalTwinsGraph.relationships) {
          this.cyRef.current.addRelationships(this.data.digitalTwinsGraph.relationships);
        }
      }
      await this.cyRef.current.doLayout();
    }

    this.setState({ error: !this.data, isLoading: false, showImportModal: false });
  }

  focus = async () => {
    if (this.cyRef.current) {
      await this.cyRef.current.doLayout();
    }
  }

  onSaveClicked = async () => {
    this.setState({ isLoading: true });

    try {
      const dataImported = await importService.save(this.data);
      this.setState({ isComplete: true, showImportModal: true, dataImported });
    } catch (exc) {
      exc.customMessage = "Error in importing graph";
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false });
  }

  closeModal = () => {
    this.setState({ showImportModal: false }, () => {
      eventService.publishModelsUpdate();
      eventService.publishCloseComponent("importComponent");
    });
  }

  render() {
    const { error, isLoading, isComplete, showImportModal, dataImported } = this.state;
    return (
      <div className="iv-grid">
        {!error && <div className="iv-toolbar">
          <ImportCommandBar className="iv-commandbar" isSaveEnabled={!isComplete} onSaveClicked={this.onSaveClicked} />
        </div>}
        {error && <div className="iv-control">
          <p>Unrecognized file format</p>
        </div>}
        {!error && <div className="iv-message">
          <h4>Graph Preview Only</h4>
          <p>Full graph validation is applied on import. Click save to import.</p>
        </div>}
        {!error && <GraphViewerCytoscapeComponent ref={this.cyRef} readOnly />}
        {isLoading && <LoaderComponent />}
        <ImportStatsComponent data={this.data} isVisible={showImportModal} dataImported={dataImported} onClose={this.closeModal} />
      </div>
    );
  }

}
