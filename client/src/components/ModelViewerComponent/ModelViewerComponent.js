// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField, Selection, SelectionMode, SelectionZone } from "office-ui-fabric-react";

import { ModelViewerCommandBarComponent } from "./ModelViewerCommandBarComponent/ModelViewerCommandBarComponent";
import { ModelViewerViewComponent } from "./ModelViewerViewComponent/ModelViewerViewComponent";
import { ModelViewerCreateComponent } from "./ModelViewerCreateComponent/ModelViewerCreateComponent";
import { ModelViewerDeleteComponent } from "./ModelViewerDeleteComponent/ModelViewerDeleteComponent";
import { ModelViewerUpdateModelImageComponent } from "./ModelViewerUpdateModelImageComponent/ModelViewerUpdateModelImageComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { readFile, sortArray } from "../../utils/utilities";
import { print } from "../../services/LoggingService";
import { ModelViewerItem } from "./ModelViewerItem/ModelViewerItem";
import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { ModelService } from "../../services/ModelService";
import { settingsService } from "../../services/SettingsService";

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
    this.uploadModelImagesRef = React.createRef();
    this.createRef = React.createRef();
    this.viewRef = React.createRef();
    this.deleteRef = React.createRef();
    this.updateModelImageRef = React.createRef();
    this.inputFileRef = null;
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

    await this.retrieveModels();

    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        this.retrieveModels();
      }
    });

    eventService.subscribeClearData(() => {
      this.setState({ items: [], isLoading: false });
    });
  }

  async retrieveModels() {
    this.setState({ isLoading: true });

    let list = [];
    try {
      list = await apiService.queryModels();
    } catch (exc) {
      exc.customMessage = "Error fetching models";
      eventService.publishError(exc);
    }

    const items = list.map(m => ({
      displayName: (m.displayName && m.displayName.en) || m.id,
      key: m.id
    }));
    sortArray(items, "displayName", "key");

    this.originalItems = items.slice(0, items.length);
    this.setState({ items, isLoading: false });
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
        if (dtdl.length) {
          dtdl.forEach(model => list.push(model));
        } else {
          list.push(dtdl);
        }
      }
    } catch (exc) {
      exc.customMessage = "Parsing error";
      eventService.publishError(exc);
    }

    if (list.length > 0) {
      await this.addModels(list);
    }

    this.setState({ isLoading: false });
    await this.retrieveModels();
    eventService.publishModelsUpdate();
    this.uploadModelRef.current.value = "";
  }

  addModels = async list => {
    let success = true;
    let sortedModels = [];
    try {
      const modelService = new ModelService();
      const sortedModelsId = await modelService.getModelIdsForUpload(list);
      sortedModels = sortedModelsId.map(id => list.filter(model => model["@id"] === id)[0]);
      const chunks = this.chunkModelsList(sortedModels, 250);
      chunks.forEach(async chunk => {
        const res = await apiService.addModels(chunk);
        print("*** Upload result:", "info");
        print(JSON.stringify(res, null, 2), "info");
      });
    } catch (exc) {
      success = false;
      exc.customMessage = "Upload error";
      eventService.publishError(exc);
    } finally {
      if (success) {
        eventService.publishCreateModel(sortedModels);
      }
    }
  }

  chunkModelsList(array, size) {
    const chunkedArr = [];
    let index = 0;
    while (index < array.length) {
      chunkedArr.push(array.slice(index, size + index));
      index += size;
    }
    return chunkedArr;
  }

  handleUploadOfModelImages = async evt => {
    const files = evt.target.files;
    this.setState({ isLoading: true });
    print("*** Uploading model images", "info");
    try {
      // Get updated list of models
      const models = await apiService.queryModels();
      for (const file of files) {
        print(`- checking image: ${file.name}`);
        const fileNameWithoutExtension = file.name.split(".")
          .slice(0, -1)
          .join(".")
          .toLowerCase();
        const matchedModels = models.filter(model => {
<<<<<<< HEAD
          const formattedModelName = model.id.toLowerCase().replace(/:/g, "_")
            .replace(/;/g, "-");
=======
          const formattedModelName = model.id.toLowerCase().split(":")
            .join("_")
            .split(";")
            .join("-");
>>>>>>> Image upload parsing update (#74)
          return formattedModelName === fileNameWithoutExtension;
        });
        if (matchedModels.length > 0) {
          const id = matchedModels[0].id;
          print(`*** Uploading model image for ${id}`, "info");
          await new Promise(resolve => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
              settingsService.setModelImage(id, fileReader.result);
              eventService.publishModelIconUpdate(id);
              print(`*** Model image uploaded for ${id}`, "info");
              resolve();
            };
            fileReader.readAsDataURL(file);
          });
        }
      }
    } catch (exc) {
      exc.customMessage = "Error fetching models";
      eventService.publishError(exc);
    }

    this.setState({ isLoading: false });
    this.uploadModelImagesRef.current.value = "";
  }

  onSetModelImage = (evt, item, ref) => {
    const imageFile = evt.target.files[0];
    const fileReader = new FileReader();

    fileReader.addEventListener("load", () => {
      settingsService.setModelImage(item.key, fileReader.result);
      eventService.publishModelIconUpdate(item.key);
      ref.current.value = "";
      this.setState({ isLoading: false });
    });

    if (imageFile) {
      fileReader.readAsDataURL(imageFile);
    }
  }

  onUpdateModelImage = (item, inputFileRef) => {
    this.updateModelImageRef.current.open(item);
    this.inputFileRef = inputFileRef.current;
  }

  onDeleteModelImage = modelId => {
    this.setState({ isLoading: true });
    print(`*** Removing model image for ${modelId}`, "info");
    settingsService.deleteModelImage(modelId);
    eventService.publishModelIconUpdate(modelId);
    this.setState({ isLoading: false });
  }

  onReplaceModelImage = modelId => {
    print(`*** Replacing model image for ${modelId}`, "info");
    this.inputFileRef.click();
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
            <ModelViewerCommandBarComponent
              className="mv-commandbar"
              buttonClass="mv-toolbarButtons"
              onDownloadModelsClicked={() => this.retrieveModels()}
              onUploadModelClicked={() => this.uploadModelRef.current.click()}
              onUploadModelImagesClicked={() => this.uploadModelImagesRef.current.click()} />
            <input id="file-input" type="file" name="name" className="mv-fileInput" multiple accept=".json"
              ref={this.uploadModelRef} onChange={this.handleUpload} />
            <input id="file-input" type="file" name="name" className="mv-fileInput" multiple accept="image/png, image/jpeg"
              ref={this.uploadModelImagesRef} onChange={this.handleUploadOfModelImages} />
          </div>
          <div>
            <TextField className="mv-filter" onChange={this.onFilterChanged} styles={this.getStyles}
              placeholder="Search" value={filterText} />
          </div>
          <div data-is-scrollable="true" className="mv-modelListWrapper">
            <SelectionZone selection={new Selection({ selectionMode: SelectionMode.single })}>
              {items.map((item, index) => {
                const modelImage = settingsService.getModelImage(item.key);
                return (
                  <ModelViewerItem key={item.key} item={item} itemIndex={index}
                    modelImage={modelImage}
                    onUpdateModelImage={this.onUpdateModelImage}
                    onSetModelImage={this.onSetModelImage} onView={() => this.onView(item)}
                    onCreate={() => this.onCreate(item)} onDelete={() => this.onDelete(item)} />
                );
              })}
            </SelectionZone>
          </div>
          {isLoading && <LoaderComponent />}
        </div>
        <ModelViewerViewComponent ref={this.viewRef} />
        <ModelViewerCreateComponent ref={this.createRef} />
        <ModelViewerDeleteComponent ref={this.deleteRef} onDelete={this.updateModelList} />
        <ModelViewerUpdateModelImageComponent
          ref={this.updateModelImageRef}
          onDelete={this.onDeleteModelImage}
          onReplace={this.onReplaceModelImage} />
      </>
    );
  }

}
