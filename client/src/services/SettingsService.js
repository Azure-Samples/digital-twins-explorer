// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { storageService } from "./StorageService";
import { REL_TYPE_OUTGOING } from "./Constants";
import { configService } from "./ConfigService";
import { colors } from "../components/GraphViewerComponent/GraphViewerCytoscapeComponent/config";

const StorageKeyName = "settings";
const EnvStorageKeyName = "environments";
const DefaultDisplayName = "$dtId";

class SettingsService {

  constructor() {
    this.settings = storageService.getLocalStorageObject(StorageKeyName)
      || { caching: false, eagerLoading: false, queries: [], relTypeLoading: REL_TYPE_OUTGOING, relExpansionLevel: 1, contrast: "normal",
        possibleDisplayNameProperties: [], selectedDisplayNameProperty: {} };
    this.modelColors = [];
  }

  get selectedDisplayNameProperty() {
    return (async () => {
      const { appAdtUrl } = await configService.getConfig();
      const selectedDisplayNameProperty = this.settings?.selectedDisplayNameProperty?.[appAdtUrl];
      return selectedDisplayNameProperty ?? DefaultDisplayName;
    })();
  }

  set selectedDisplayNameProperty(selectedDisplayNameProperty) {
    (async () => {
      const { appAdtUrl } = await configService.getConfig();
      if (this.settings.selectedDisplayNameProperty) {
        this.settings.selectedDisplayNameProperty[appAdtUrl] = selectedDisplayNameProperty;
      } else {
        this.settings.selectedDisplayNameProperty = {
          [appAdtUrl]: selectedDisplayNameProperty
        };
      }
      this.save();
    })();
  }

  get possibleDisplayNameProperties() {
    return this.settings.possibleDisplayNameProperties || [];
  }

  set possibleDisplayNameProperties(possibleDisplayNameProperties) {
    this.settings.possibleDisplayNameProperties = possibleDisplayNameProperties;
    this.save();
  }

  get caching() {
    return this.settings.caching || false;
  }

  set caching(caching) {
    this.settings.caching = caching;
    this.save();
  }

  get eagerLoading() {
    return this.settings.eagerLoading || false;
  }

  set eagerLoading(eagerLoading) {
    this.settings.eagerLoading = eagerLoading;
    this.save();
  }

  get queries() {
    return this.settings.queries || [];
  }

  set queries(queries) {
    this.settings.queries = queries;
    this.save();
  }

  get contrast() {
    return this.settings.contrast || "normal";
  }

  set contrast(contrast) {
    this.settings.contrast = contrast;
    this.save();
  }

  get relTypeLoading() {
    return this.settings.relTypeLoading || REL_TYPE_OUTGOING;
  }

  set relTypeLoading(relTypeLoading) {
    this.settings.relTypeLoading = relTypeLoading;
    this.save();
  }

  get relExpansionLevel() {
    return this.settings.relExpansionLevel || 1;
  }

  set relExpansionLevel(relExpansionLevel) {
    this.settings.relExpansionLevel = relExpansionLevel;
    this.save();
  }

  setModelColors(modelIds) {
    this.modelColors = [];
    for (let i = 0; i < modelIds.length; i++) {
      const im = i % colors.length;
      this.modelColors[modelIds[i]] = `#${(colors[(colors.length - 1) - im])}`;
    }
  }

  getModelColors() {
    return this.modelColors;
  }

  get environments() {
    return storageService.getLocalStorageObject(EnvStorageKeyName);
  }

  set environments(envs) {
    storageService.setLocalStorageObject(EnvStorageKeyName, envs);
  }

  getModelImage = modelId => storageService.getLocalStoragePrimitive(modelId);

  setModelImage = (modelId, dataString) => storageService.setLocalStorageObject(modelId, dataString);

  deleteModelImage = modelId => storageService.removeLocalStorageObject(modelId);

  save() {
    storageService.setLocalStorageObject(StorageKeyName, this.settings);
  }

}

export const settingsService = new SettingsService();
