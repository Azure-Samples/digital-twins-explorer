// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class EventService {

  constructor() {
    this.eventHub = null;
    this.queue = [];
  }

  initialize(eventHub) {
    this.eventHub = eventHub;
    this.queue.forEach(x => this._action(x));
    this.queue = [];
  }

  publishQuery(query) {
    this._emit("query", query);
  }

  subscribeQuery(callback) {
    this._on("query", callback);
  }

  publishOverlayQueryResults(overlayResults) {
    this._emit("overlay", overlayResults);
  }

  subscribeOverlayQueryResults(callback) {
    this._on("overlay", callback);
  }

  publishLog(data, type) {
    this._emit("log", { data, type });
  }

  subscribeLog(callback) {
    this._on("log", callback);
  }

  publishConfigure(evt) {
    this._emit("configure", evt);
  }

  subscribeConfigure(callback) {
    this._on("configure", callback);
  }

  unsubscribeConfigure(callback) {
    this._off("configure", callback);
  }

  publishPreferences(evt) {
    this._emit("preferences", evt);
  }

  subscribePreferences(callback) {
    this._on("preferences", callback);
  }

  unsubscribePreferences(callback) {
    this._off("preferences", callback);
  }

  publishClearTwinsData() {
    this._emit("cleartwins");
  }

  subscribeClearTwinsData(callback) {
    this._on("cleartwins", callback);
  }

  publishClearModelsData() {
    this._emit("clearmodels");
  }

  subscribeClearModelsData(callback) {
    this._on("clearmodels", callback);
  }

  publishError(error) {
    this._emit("error", error);
  }

  subscribeError(callback) {
    this._on("error", callback);
  }

  unsubscribeError(callback) {
    this._off("error", callback);
  }

  publishSelection(selection) {
    this._emit("selection", selection);
  }

  subscribeSelection(callback) {
    this._on("selection", callback);
  }

  publishCreateTwin(evt) {
    this._emit("createtwin", evt);
  }

  subscribeCreateTwin(callback) {
    this._on("createtwin", callback);
  }

  publishDeleteTwin(id) {
    this._emit("delete", id);
  }

  subscribeDeleteTwin(callback) {
    this._on("delete", callback);
  }

  publishAddRelationship(evt) {
    this._emit("addrelationship", evt);
  }

  subscribeAddRelationship(callback) {
    this._on("addrelationship", callback);
  }

  publishDeleteRelationship(evt) {
    this._emit("deleterelationship", evt);
  }

  subscribeDeleteRelationship(callback) {
    this._on("deleterelationship", callback);
  }

  publishCreateModel(models) {
    this._emit("createmodel", models);
  }

  subscribeCreateModel(callback) {
    this._on("createmodel", callback);
  }


  publishDeleteModel(evt) {
    this._emit("deletemodel", evt);
  }

  subscribeDeleteModel(callback) {
    this._on("deletemodel", callback);
  }

  publishSelectModel(item) {
    this._emit("selectmodel", item);
  }

  subscribeSelectModel(callback) {
    this._on("selectmodel", callback);
  }

  publishModelSelectionUpdatedInGraph(modelId) {
    this._emit("modelselectionupdatedingraph", modelId);
  }

  subscribeModelSelectionUpdatedInGraph(callback) {
    this._on("modelselectionupdatedingraph", callback);
  }

  publishCloseComponent(component) {
    this._emit("closecomponent", component);
  }

  subscribeCloseComponent(callback) {
    this._on("closecomponent", callback);
  }

  publishOpenOptionalComponent(component) {
    this._emit("opencomponent", component);
  }

  subscribeOpenOptionalComponent(callback) {
    this._on("opencomponent", callback);
  }

  publishComponentClosed(component) {
    this._emit("componentclosed", component);
  }

  subscribeComponentClosed(callback) {
    this._on("componentclosed", callback);
  }

  publishImport(evt) {
    this._emit("import", evt);
  }

  subscribeImport(callback) {
    this._on("import", callback);
  }

  publishExport(evt) {
    this._emit("export", evt);
  }

  subscribeExport(callback) {
    this._on("export", callback);
  }

  publishLoading(isLoading) {
    this._emit("loading", isLoading);
  }

  subscribeLoading(callback) {
    this._on("loading", callback);
  }

  publishModelIconUpdate(modelId) {
    this._emit("modeliconupdate", modelId);
  }

  subscribeModelIconUpdate(callback) {
    this._on("modeliconupdate", callback);
  }

  publishModelsUpdate(modelId) {
    this._emit("modelsupdate", modelId);
  }

  subscribeModelsUpdate(callback) {
    this._on("modelsupdate", callback);
  }

  publishEnvironmentChange() {
    this._emit("environmentChanged");
  }

  subscribeEnvironmentChange(callback) {
    this._on("environmentChanged", callback);
  }

  unsubscribeEnvironmentChange(callback) {
    this._off("environmentChanged", callback);
  }

  _emit = (name, payload) => this._action({ type: "emit", name, payload });

  _off = (name, payload) => this._action({ type: "off", name, payload });

  _on = (name, payload) => this._action({ type: "on", name, payload });

  _action({ type, name, payload }) {
    if (this.eventHub) {
      this.eventHub[type](name, payload);
    } else {
      this.queue.push({ type, name, payload });
    }
  }

}

export const eventService = new EventService();
