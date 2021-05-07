// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField } from "office-ui-fabric-react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { applyPatch, compare, deepClone } from "fast-json-patch";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { PropertyInspectorCommandBarComponent } from "./PropertyInspectorCommandBarComponent/PropertyInspectorCommandBarComponent";
import { PropertyInspectorPatchInformationComponent }
  from "./PropertyInspectorPatchInformationComponent/PropertyInspectorPatchInformationComponent";
import { print } from "../../services/LoggingService";
import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { signalRService } from "../../services/SignalRService";
import { ModelService } from "../../services/ModelService";

import "jsoneditor-react/es/editor.min.css";
import "./PropertyInspectorComponent.scss";
import "../ModalComponent/ModalComponent.scss";

const NonPatchableFields = [ "$dtId", "$etag", "$metadata", "telemetry" ];

const applyDefaultValues = (properties, selection) => {
  if (!selection || !properties) {
    return selection;
  }

  const modelService = new ModelService();
  for (const p of Object.keys(properties)) {
    if (!properties[p].schema) {
      if (!selection[p]) {
        selection[p] = {};
      }

      applyDefaultValues(properties[p], selection[p]);
      continue;
    }

    if (selection[p]) {
      continue;
    }

    const value = modelService.getPropertyDefaultValue(properties[p].schema);
    selection[p] = value;
  }

  return selection;
};

const reTypeDelta = (properties, delta) => {
  const modelService = new ModelService();
  for (const d of delta) {
    const parts = d.path.split("/").filter(x => x);

    let match = properties;
    for (const p of parts) {
      match = match[p];
      if (!match) {
        break;
      }
    }

    if (match && match.schema) {
      d.value = modelService.getPropertyDefaultValue(match.schema, d.value);
      if (d.value === "") {
        d.op = "remove";
        delete d.value;
      }
    }
  }

  return delta;
};

export class PropertyInspectorComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selection: null,
      selectionType: null,
      changed: false,
      patch: null,
      isLoading: false,
      isLoadingSelection: false
    };
    this.editorRef = React.createRef();
    this.properties = null;
    this.isDefined = null;
    this.original = null;
    this.updated = null;
    this.modelService = null;
  }

  get editor() {
    return this.editorRef.current ? this.editorRef.current.jsonEditor : null;
  }

  componentDidMount() {
    this.initializeModelService();
    this.subscribeSelection();
    this.subscribeTelemetry();
    eventService.subscribeCreateModel(models => {
      this.initializeModelService();
      models.forEach(model => {
        this.updateEditorAfterModelDeleteOrCreate(model["@id"]);
      });
    });
    eventService.subscribeDeleteModel(model => {
      this.initializeModelService();
      this.updateEditorAfterModelDeleteOrCreate(model);
    });
  }

  initializeModelService = () => {
    this.modelService = new ModelService();
  }

  updateEditorAfterModelDeleteOrCreate = async model => {
    if (this.original && this.original.$metadata.$model === model) {
      await this.updateModelProperties(model);
      this.styleTwinInEditorProperties();
    }
  }

  subscribeTelemetry = () => {
    signalRService.subscribe("telemetry", telemetry => {
      const { selection } = this.state;
      if (telemetry && telemetry.dtId === selection.$dtId) {
        const appendedSelection = {...selection};
        appendedSelection.telemetry = telemetry.data;
        this.setState({ selection: appendedSelection });
        this.original.telemetry = this.updated.telemetry = telemetry.data;
        this.editor.update(this.updated);
      }
    });
  }

  updateModelProperties = async modelId => {
    let properties = null;
    let isDefined = false;
    try {
      if (modelId) {
        const model = await this.modelService.getModel(modelId);
        properties = model.componentProperties;
        isDefined = model.isDefined;
      }
    } catch (exc) {
      print(`*** Error fetching twin properties: ${exc}`, "error");
    }
    this.properties = properties;
    this.isDefined = isDefined;
  }

  subscribeSelection = () => {
    eventService.subscribeSelection(payload => {
      if (payload) {
        const { selection, selectionType } = payload;
        this.setState({ isLoadingSelection: true });
        this.setContent(selection, selectionType, null);
      } else {
        this.setState({ changed: false, selection: null, patch: null, selectionType: null, isLoadingSelection: false });
      }
    });
  }

  setContent = async (selection, selectionType, patch) => {
    if (selectionType === "twin") {
      await this.updateModelProperties(selection ? selection.$metadata.$model : null);
      this.original = this.updated = selection ? await applyDefaultValues(this.properties, deepClone(selection)) : null;
    } else if (selectionType === "relationship") {
      this.original = this.updated = selection ? selection : null;
    }
    const { isLoadingSelection } = this.state;
    if (isLoadingSelection) {
      this.setState({ changed: false, selection, patch, selectionType }, () => {
        if (selection) {
          this.editor.set(this.original);
          this.styleTwinInEditorProperties();
        }
      });
    } else {
      this.original = this.updated = selection ? selection : null;
      this.setState({ changed: false, selection: null, patch: null, selectionType: null, isLoadingSelection: false });
    }
  }

  styleTwinInEditorProperties = () => {
    this.editor.node.childs.forEach(item => {
      if (!item.field.startsWith("$")) {
        if (this.properties[item.field]) {
          this.stylePropertyNodeStyle(item, "", "");
        } else {
          this.stylePropertyNodeStyle(item, "yellow", "important");
        }
      }
    });
    const rootMetaIndex = this.editor.node.childs.findIndex(item => item.field.toLowerCase() === "$metadata");
    if (rootMetaIndex >= 0) {
      const metadataNode = this.editor.node.childs[rootMetaIndex];
      metadataNode.expand(true);
      const modelIndex = metadataNode.childs.findIndex(item => item.field.toLowerCase() === "$model");
      if (modelIndex >= 0) {
        if (this.isDefined) {
          metadataNode.childs[modelIndex].dom.field.style.setProperty("color", "");
          metadataNode.childs[modelIndex].dom.value.style.setProperty("color", "");
        } else {
          metadataNode.childs[modelIndex].dom.field.style.setProperty("color", "red", "important");
          metadataNode.childs[modelIndex].dom.value.style.setProperty("color", "red", "important");
        }
      }
    }
  }

  stylePropertyNodeStyle = (item, color, important) => {
    if (item.dom.field) {
      item.dom.field.style.setProperty("color", color, important);
      item.dom.value.style.setProperty("color", color, important);
    }
    if (item.type === "object") {
      item.expand(true);
      item.childs.forEach(child => {
        this.stylePropertyNodeStyle(child, color, important);
      });
    }
  }

  showModal = () => {
    this.setState({ showModal: true });
  }

  closeModal = () => {
    this.setState({ showModal: false });
  }

  onEditable = node => {
    const { selectionType } = this.state;
    if (node && node.field === "") {
      return { field: true, value: true };
    }

    if (node && selectionType === "twin") {
      let current = this.properties;
      for (const p of node.path) {
        if (NonPatchableFields.indexOf(p) > -1 || ("writable" in current && !current.writable)) {
          return { field: false, value: false };
        }

        current = current[p];
        if (!current) {
          break;
        }
      }
    }

    return { field: false, value: true };
  }

  handleEditorChange = data => {
    this.updated = data;
    this.setState({ changed: true });
  }

  onExpand = () => {
    this.editor.expandAll();
  }

  onCollapse = () => {
    this.editor.collapseAll();
  }

  onUndo = () => {
    this.editor.history.undo();
    if (this.editor.history.index < 0) {
      this.setState({ changed: false });
    }
  }

  onRedo = () => {
    this.editor.history.redo();
    if (this.editor.history.index >= 0) {
      this.setState({ changed: true });
    }
  }

  onSearchChange = (_, text) => {
    if (this.editor) {
      this.editor.search(text);
    }
  }

  onSave = async () => {
    const { changed, selection, selectionType } = this.state;
    if (changed && selectionType === "twin") {
      const deltaFromDefaults = compare(this.original, this.updated);
      const deltaFromOriginal = compare(selection, this.updated);
      const delta = reTypeDelta(this.properties, deltaFromOriginal.filter(x =>
        deltaFromDefaults.some(y => y.path === x.path)
          || deltaFromDefaults.some(y => y.path.startsWith(`${x.path}/`))));
      const modelService = new ModelService();
      try {
        modelService.validateTwinPatch(this.properties, delta);
        this.setState({ patch: delta });
        const patch = JSON.stringify(delta, null, 2);
        print("*** PI Changes:", "info");
        print(patch, "info");
        if (patch.length > 0) {
          await this.patchTwin(delta);

          const { newDocument } = applyPatch(this.original, delta, false, false);
          this.setContent(newDocument, selectionType, delta);

          this.showModal();
          this.setState({ changed: false });
        }
      } catch (exc) {
        exc.customMessage = "Error in patching twin";
        eventService.publishError(exc);
      }
    }
  }

  async patchTwin(res) {
    this.setState({ isLoading: true });
    try {
      print(`*** Patching twin ${this.original.$dtId}`, "info");
      await apiService.updateTwin(this.original.$dtId, res);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  onClassName = ({ path }) => path.includes("telemetry") && path.length > 1 ? "jsoneditor-telemetry" : null

  render() {
    const { showModal, selection, changed, patch, isLoading, selectionType } = this.state;
    return (
      <div className="pi-gridWrapper">
        <div className="pi-grid">
          <PropertyInspectorCommandBarComponent buttonClass="pi-toolbarButtons"
            changed={changed}
            selection={selection}
            selectionType={selectionType}
            onExpand={() => this.onExpand()}
            onCollapse={() => this.onCollapse()}
            onUndo={() => this.onUndo()}
            onRedo={() => this.onRedo()}
            onSave={() => this.onSave()} />
          <TextField className="pi-filter" onChange={this.onSearchChange} placeholder="Search" />
          <div className="pi-editor">
            {selection && <Editor
              ref={this.editorRef}
              mainMenuBar={false}
              enableTransform={false}
              enableSort={false}
              history
              onEditable={this.onEditable}
              onChange={this.handleEditorChange}
              onClassName={this.onClassName} />}
          </div>
          <PropertyInspectorPatchInformationComponent isVisible={showModal} patch={patch} onCloseModal={this.closeModal} />
          {isLoading && <LoaderComponent />}
        </div>
      </div>
    );
  }

}
