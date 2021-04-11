// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { eventService } from "./EventService";
import { storageService } from "./StorageService";
import { apiService } from "./ApiService";

const StorageKeyName = "configuration";

class ConfigService {

  constructor() {
    eventService.subscribeConfigure(evt => {
      if (evt.type === "end" && evt.config) {
        storageService.setLocalStorageObject(StorageKeyName, evt.config);
        apiService.clearCache();
      }
    });
  }

  getConfig(force) {
    const config = storageService.getLocalStorageObject(StorageKeyName);
    if (config && !force) {
      const params = new URLSearchParams(window.location.search);
      const queryParamAppAdtUrl = params.get("adtUrl");
      config.appAdtUrl = queryParamAppAdtUrl ? queryParamAppAdtUrl : config.appAdtUrl;
      return config;
    }

    return new Promise((resolve, reject) => {
      const callback = evt => {
        if (evt.type === "end") {
          eventService.unsubscribeConfigure(callback);
          if (evt.config) {
            storageService.setLocalStorageObject(StorageKeyName, evt.config);
            apiService.clearCache();
            resolve(evt.config);
          } else {
            const e = new Error("Configuration aborted");
            e.errorCode = "user_cancelled";
            reject(e);
          }
        }
      };

      eventService.subscribeConfigure(callback);
      eventService.publishConfigure({ type: "start", config });
    });
  }

}

export const configService = new ConfigService();
