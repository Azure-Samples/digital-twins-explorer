// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { Link } from "office-ui-fabric-react";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { exportService } from "../../services/ExportService";
import { eventService } from "../../services/EventService";
import { print } from "../../services/LoggingService";

import "./ExportComponent.scss";

export class ExportComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      downloadUrl: null
    };
  }

  async componentDidMount() {
    let data = null;
    try {
      const { query } = this.props;
      data = await exportService.save(query);
    } catch (e) {
      print(`*** Error in exporting graph: ${e}`, "error");
      eventService.publishError(`*** Error in exporting graph: ${e}`);
    }

    if (data) {
      const blob = new Blob([ JSON.stringify(data) ], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      this.setState({ downloadUrl });
    }

    this.setState({ isLoading: false });
  }

  download = () => {
    const { downloadUrl } = this.state;
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    this.setState({ downloadUrl: null });
  }

  render() {
    const { isLoading, downloadUrl } = this.state;
    return (
      <div className="ev-grid">
        {downloadUrl && <div className="ev-control">
          <Link href={downloadUrl} download onClick={this.download}>Download</Link>
        </div>}
        {isLoading && <LoaderComponent />}
      </div>
    );
  }

}
