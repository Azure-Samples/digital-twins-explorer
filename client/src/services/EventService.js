// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import PubSub from "pubsub-js";

const buildCallback = c => (e, val) => c(val);
class EventService {

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

  publishClearCache(evt) {
    this._emit("clearcache", evt);
  }

  subscribeClearCache(callback) {
    this._on("clearcache", callback);
  }

  unsubscribeClearCache(callback) {
    this._off("clearcache", callback);
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

  publishGraphTwins(selection) {
    this._emit("graphtwins", selection);
  }

  subscribeGraphTwins(callback) {
    this._on("graphtwins", callback);
  }

  publishGraphRelationships(selection) {
    this._emit("graphrels", selection);
  }

  subscribeGraphRelationships(callback) {
    this._on("graphrels", callback);
  }

  publishFocusTwin(twin) {
    this._emit("focustwin", twin);
  }

  subscribeFocusTwin(callback) {
    this._on("focustwin", callback);
  }

  publishBlurTwin(twin) {
    this._emit("blurtwin", twin);
  }

  subscribeBlurTwin(callback) {
    this._on("blurtwin", callback);
  }

  publishFocusModel(model) {
    this._emit("focusmodel", model);
  }

  subscribeFocusModel(callback) {
    this._on("focusmodel", buildCallback(callback));
  }

  publishBlurModel(model) {
    this._emit("blurmodel", model);
  }

  subscribeBlurModel(callback) {
    this._on("blurmodel", callback);
  }

  publishSelectTwins(twins) {
    this._emit("clicktwins", twins);
  }

  subscribeSelectTwins(callback) {
    this._on("clicktwins", callback);
  }

  publishClickRelationship(rel) {
    this._emit("clickrel", rel);
  }

  subscribeClickRelationship(callback) {
    this._on("clickrel", callback);
  }

  publishRelationshipContextMenu(rel) {
    this._emit("relcontextmenu", rel);
  }

  subscribeRelationshipContextMenu(callback) {
    this._on("relcontextmenu", callback);
  }

  publishTwinContextMenu(rel) {
    this._emit("twincontextmenu", rel);
  }

  subscribeTwinContextMenu(callback) {
    this._on("twincontextmenu", callback);
  }

  publishClearGraphSelection() {
    this._emit("cleargraphselection");
  }

  subscribeClearGraphSelection(callback) {
    this._on("cleargraphselection", callback);
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

  publishSelectedTwins(twins) {
    this._emit("selectedtwins", twins);
  }

  subscribeSelectedTwins(callback) {
    this._on("selectedtwins", callback);
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

  publishFocusConsole(component) {
    this._emit("focusconsole", component);
  }

  subscribeFocusConsole(callback) {
    this._on("focusconsole", buildCallback(callback));
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

  publishOpenTabularView(relationships) {
    this._emit("tabularView", relationships);
  }

  subscribeOpenTabularView(callback) {
    this._on("tabularView", callback);
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

  publishFocusRelationshipsToggle(e) {
    this._emit("focusrelationshiptoggle", e);
  }

  subscribeFocusRelationshipsToggle(callback) {
    this._on("focusrelationshiptoggle", buildCallback(callback));
  }

  publishFocusModelViewer() {
    this._emit("focusmodelviewer");
  }

  subscribeFocusModelViewer(callback) {
    this._on("focusmodelviewer", buildCallback(callback));
  }

  publishFocusTwinViewer() {
    this._emit("focustwinviewer");
  }

  subscribeFocusTwinViewer(callback) {
    this._on("focustwinviewer", buildCallback(callback));
  }

  publishHideWarningMessage() {
    this._emit("hideWarningMessage");
  }

  subscribeHideWarningMessage(callback) {
    this._on("hideWarningMessage", buildCallback(callback));
  }

  _emit = (name, payload) => this._action({ type: "publish", name, payload });

  _off = (name, payload) => this._action({ type: "unsubscribe", name, payload });

  _on = (name, payload) => this._action({ type: "subscribe", name, payload: buildCallback(payload) });

  _action({ type, name, payload }) {
    PubSub[type](name, payload);
  }

}

export const eventService = new EventService();
