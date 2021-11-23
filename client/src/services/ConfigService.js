// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { eventService } from "./EventService";
import { storageService } from "./StorageService";

const StorageKeyName = "configuration";

class ConfigService {

  constructor() {
    const initConfig = async () => {
      this._config = await this.getConfig();
    };
    initConfig();
  }

  setConfig(config) {
    this._config = config;
    storageService.setLocalStorageObject(StorageKeyName, config);
    eventService.publishClearCache();
  }

  getConfig() {
    if (this._config) {
      return Promise.resolve(this._config);
    }

    const localStorageConfig = storageService.getLocalStorageObject(StorageKeyName);
    if (localStorageConfig) {
      return Promise.resolve(localStorageConfig);
    }

    return new Promise((resolve, reject) => {
      const callback = evt => {
        if (evt.type === "end") {
          eventService.unsubscribeConfigure(callback);
          if (evt.config) {
            this.setConfig(evt.config);
            resolve(evt.config);
          } else {
            const e = new Error("Configuration aborted");
            e.errorCode = "user_cancelled";
            reject(e);
          }
        }
      };

      eventService.subscribeConfigure(callback);
      eventService.publishConfigure({ type: "start" });
    });
  }

}

export const configService = new ConfigService();
