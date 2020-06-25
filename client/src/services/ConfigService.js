// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { eventService } from "./EventService";
import { storageService } from "./StorageService";
import { apiService } from "./ApiService";
import { authService } from "./AuthService";

const StorageKeyName = "configuration";

class ConfigService {

  getConfig(force) {
    const config = storageService.getLocalStorageObject(StorageKeyName);
    if (config && !force) {
      return config;
    }

    return new Promise((resolve, reject) => {
      const callback = evt => {
        if (evt.type === "end") {
          eventService.unsubscribeConfigure(callback);
          if (evt.config) {
            storageService.setLocalStorageObject(StorageKeyName, evt.config);
            apiService.clearCache();
            authService.reset();
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
