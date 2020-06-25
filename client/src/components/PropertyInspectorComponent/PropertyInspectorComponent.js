// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField } from "office-ui-fabric-react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { compare, deepClone } from "fast-json-patch";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { PropertyInspectorCommandBarComponent } from "./PropertyInspectorCommandBarComponent/PropertyInspectorCommandBarComponent";
import { PropertyInspectorPatchInformationComponent }
  from "./PropertyInspectorPatchInformationComponent/PropertyInspectorPatchInformationComponent";
import { print } from "../../services/LoggingService";
import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { signalRService } from "../../services/SignalRService";
import { authService } from "../../services/AuthService";
import { ModelService } from "../../services/ModelService";

import "jsoneditor-react/es/editor.min.css";
import "./PropertyInspectorComponent.scss";
import "../ModalComponent/ModalComponent.scss";

const NonPatchableFields = [ "$dtId", "$etag", "$metadata", "telemetry" ];

const applyDefaultValues = (properties, selection) => {
  if (!selection || !properties) {
    return selection;
  }

  for (const p of properties) {
    if (selection[p.name]) {
      continue;
    }

    switch (p.schema) {
      case "dtmi:dtdl:instance:Schema:double;2":
      case "dtmi:dtdl:instance:Schema:integer;2":
      case "dtmi:dtdl:instance:Schema:long;2":
      case "dtmi:dtdl:instance:Schema:float;2":
        selection[p.name] = 0;
        break;
      case "dtmi:dtdl:instance:Schema:string;2":
        selection[p.name] = " ";
        break;
      case "dtmi:dtdl:instance:Schema:boolean;2":
        selection[p.name] = false;
        break;
      default:
        break;
    }
  }

  return selection;
};

export class PropertyInspectorComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selection: null,
      changed: false,
      patch: null,
      isLoading: false
    };
    this.editorRef = React.createRef();
    this.properties = null;
    this.original = null;
    this.updated = null;
  }

  get editor() {
    return this.editorRef.current ? this.editorRef.current.jsonEditor : null;
  }

  componentDidMount() {
    this.subscribeSelection();
    if (authService.isLoggedIn) {
      this.subscribeTelemetry();
    } else {
      const callback = () => {
        this.subscribeTelemetry();
        eventService.unsubscribeLogin(callback);
      };
      eventService.subscribeLogin(callback);
    }
  }

  subscribeTelemetry = () => {
    signalRService.subscribe("telemetry", telemetry => {
      const { selection } = this.state;
      if (telemetry && telemetry.dtId === selection.$dtId) {
        const appendedSelection = {...selection};
        appendedSelection.telemetry = telemetry.data;
        this.setState({ selection: appendedSelection });
        this.editor.update(appendedSelection);
      }
    });
  }

  subscribeSelection = () => {
    eventService.subscribeSelection(async selection => {
      let properties = null;
      try {
        properties = selection ? await new ModelService().getProperties(selection.$metadata.$model) : null;
      } catch (exc) {
        print(`*** Error fetching twin properties: ${exc}`, "error");
      }

      this.properties = properties;
      this.original = this.updated = selection ? await applyDefaultValues(properties, deepClone(selection)) : null;
      this.setState({ changed: false, selection, patch: null });
      if (selection) {
        this.editor.set(this.original);
      }
    });
  }

  showModal = () => {
    this.setState({ showModal: true });
  }

  closeModal = () => {
    this.setState({ showModal: false });
  }

  onEditable = node => {
    if (node && node.field === "") {
      return { field: true, value: true };
    }

    if (node && (NonPatchableFields.indexOf(node.path[0]) > -1
      || this.properties.some(x => x.name === node.field && x.writeable === false))) {
      return { field: false, value: false };
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
    const { changed, selection } = this.state;
    if (changed) {
      const deltaFromDefaults = compare(this.original, this.updated);
      const deltaFromOriginal = compare(selection, this.updated);
      const delta = deltaFromOriginal.filter(x => deltaFromDefaults.some(y => y.path === x.path));
      this.setState({ patch: delta });

      const patch = JSON.stringify(delta, null, 2);
      print("*** PI Changes:", "info");
      print(patch, "info");
      if (patch.length > 0) {
        await this.patchTwin(delta);
      }

      this.showModal();
      this.setState({ changed: false });
    }
  }

  async patchTwin(res) {
    this.setState({ isLoading: true });
    try {
      print(`*** Patching twin ${this.original.$dtId}`, "info");
      await apiService.updateTwin(this.original.$dtId, res);
    } catch (exc) {
      print(`*** Error in patching twin: ${exc}`, "error");
      eventService.publishError(`*** Error in patching twin: ${exc}`);
    }
    this.setState({ isLoading: false });
  }

  onClassName = ({ path }) => path.includes("telemetry") && path.length > 1 ? "jsoneditor-telemetry" : null

  render() {
    const { showModal, selection, changed, patch, isLoading } = this.state;
    return (
      <div className="pi-gridWrapper">
        <div className="pi-grid">
          <PropertyInspectorCommandBarComponent buttonClass="pi-toolbarButtons"
            changed={changed}
            selection={selection}
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
