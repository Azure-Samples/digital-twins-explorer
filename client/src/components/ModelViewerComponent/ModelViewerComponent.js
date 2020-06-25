// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, Selection, SelectionMode, SelectionZone } from "office-ui-fabric-react";

import { ModelViewerCommandBarComponent } from "./ModelViewerCommandBarComponent/ModelViewerCommandBarComponent";
import { ModelViewerViewComponent } from "./ModelViewerViewComponent/ModelViewerViewComponent";
import { ModelViewerCreateComponent } from "./ModelViewerCreateComponent/ModelViewerCreateComponent";
import { ModelViewerDeleteComponent } from "./ModelViewerDeleteComponent/ModelViewerDeleteComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { readFile, sortArray } from "../../utils/utilities";
import { print } from "../../services/LoggingService";
import { ModelViewerItem } from "./ModelViewerItem/ModelViewerItem";
import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { authService } from "../../services/AuthService";

import "./ModelViewerComponent.scss";

export class ModelViewerComponent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      items: [],
      filterText: "",
      isLoading: false
    };

    this.originalItems = [];
    this.uploadModelRef = React.createRef();
    this.createRef = React.createRef();
    this.viewRef = React.createRef();
    this.deleteRef = React.createRef();
  }

  async componentDidMount() {
    eventService.subscribeDeleteModel(id => {
      if (id) {
        this.originalItems.splice(this.originalItems.findIndex(i => i.key === id), 1);
        const items = this.originalItems;
        this.setState({ items, filterText: "" });
      }
    });
    eventService.subscribeCreateModel(() => this.retrieveModels());

    if (authService.isLoggedIn) {
      await this.retrieveModels();
    } else {
      eventService.subscribeLogin(async () => {
        if (!this.state.isLoading && this.state.items.length === 0) {
          await this.retrieveModels();
        }
      });
      eventService.subscribeConfigure(evt => {
        if (evt.type === "end" && evt.config) {
          this.setState({ items: [], isLoading: false });
        }
      });
    }
    eventService.subscribeClearData(() => {
      this.setState({ items: [], isLoading: false });
    });
  }

  onFilterChanged = (_, text) => {
    this.setState({
      filterText: text,
      items: text ? this.originalItems.filter(item => item.key.toLowerCase().indexOf(text.toLowerCase()) >= 0) : this.originalItems
    });
  }

  handleUpload = async evt => {
    const files = evt.target.files;
    this.setState({ isLoading: true });

    print("*** Uploading selected models", "info");
    const list = [];
    try {
      for (const file of files) {
        print(`- working on ${file.name}`);
        const dtdl = await readFile(file);
        list.push(dtdl);
      }
    } catch (exc) {
      print(`*** Parsing error: ${exc}`, "error");
      eventService.publishError(`*** Parsing error: ${exc}`);
    }

    if (list.length > 0) {
      try {
        const res = await apiService.addModels(list);
        print("*** Upload result:", "info");
        print(JSON.stringify(res, null, 2), "info");
      } catch (exc) {
        print(`*** Upload error: ${exc}`, "error");
        eventService.publishError(`*** Upload error: ${exc}`);
      }
    }

    this.setState({ isLoading: false });
    this.retrieveModels();
    this.uploadModelRef.current.value = "";
  }

  async retrieveModels() {
    this.setState({ isLoading: true });

    let list = [];
    try {
      list = await apiService.queryModels();
    } catch (exc) {
      print(`*** Error fetching models: ${exc}`, "error");
      eventService.publishError(`*** Error fetching models: ${exc}`);
    }

    const items = list.map(m => ({
      displayName: (m.displayName && m.displayName.en) || m.id,
      key: m.id
    }));
    sortArray(items, "displayName", "key");

    this.originalItems = items.slice(0, items.length);
    this.setState({ items, isLoading: false });
  }

  onView = item => this.viewRef.current.open(item)

  onCreate = item => this.createRef.current.open(item)

  onDelete = item => this.deleteRef.current.open(item)

  updateModelList = itemKey => {
    this.originalItems.splice(this.originalItems.findIndex(i => i.key === itemKey), 1);
    const items = this.originalItems;
    this.setState({ items, filterText: "" });
  }

  render() {
    const { items, isLoading, filterText } = this.state;
    return (
      <>
        <div className="mv-grid">
          <div className="mv-toolbar">
            <ModelViewerCommandBarComponent className="mv-commandbar" buttonClass="mv-toolbarButtons"
              onDownloadModelsClicked={() => this.retrieveModels()}
              onUploadModelClicked={() => this.uploadModelRef.current.click()} />
            <input id="file-input" type="file" name="name" className="mv-fileInput" multiple accept=".json"
              ref={this.uploadModelRef} onChange={this.handleUpload} />
          </div>
          <div>
            <TextField className="mv-filter" onChange={this.onFilterChanged} styles={this.getStyles}
              placeholder="Search" value={filterText} />
          </div>
          <div data-is-scrollable="true" className="mv-modelListWrapper">
            <SelectionZone selection={new Selection({ selectionMode: SelectionMode.single })}>
              {items.map((item, index) => (
                <ModelViewerItem key={item.key} item={item} itemIndex={index}
                  onView={() => this.onView(item)} onCreate={() => this.onCreate(item)} onDelete={() => this.onDelete(item)} />
              ))}
            </SelectionZone>
          </div>
          {isLoading && <LoaderComponent />}
        </div>
        <ModelViewerViewComponent ref={this.viewRef} />
        <ModelViewerCreateComponent ref={this.createRef} />
        <ModelViewerDeleteComponent ref={this.deleteRef} onDelete={this.updateModelList} />
      </>
    );
  }

}
