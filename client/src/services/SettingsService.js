// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { storageService } from "./StorageService";
import { REL_TYPE_OUTGOING } from "./Constants";

const StorageKeyName = "settings";
const EnvStorageKeyName = "environments";

class SettingsService {

  constructor() {
    this.settings = storageService.getLocalStorageObject(StorageKeyName)
      || { caching: true, eagerLoading: false, queries: [], relTypeLoading: REL_TYPE_OUTGOING, relExpansionLevel: 1 };
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

  get environments() {
    return storageService.getLocalStorageObject(EnvStorageKeyName);
  }

  set environments(envs) {
    storageService.setLocalStorageObject(EnvStorageKeyName, envs);
  }

  getModelImage = modelId => {
    const image = storageService.getLocalStoragePrimitive(modelId);
    return image ? image : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  setModelImage = (modelId, dataString) => storageService.setLocalStorageObject(modelId, dataString);

  deleteModelImage = modelId => storageService.removeLocalStorageObject(modelId);

  save() {
    storageService.setLocalStorageObject(StorageKeyName, this.settings);
  }

}

export const settingsService = new SettingsService();
