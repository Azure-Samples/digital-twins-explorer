// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as signalR from "@microsoft/signalr";

import { authService } from "./AuthService";
import { configService } from "./ConfigService";
import { print } from "./LoggingService";

class SignalRService {

  async initialize() {
    if (!this.connection) {
      try {
        const accessToken = await authService.login();
        const { appAdtUrl } = await configService.getConfig();

        let signalRUrl = `/api/signalr/?x-adt-host=${new URL(appAdtUrl).hostname}`;
        if (process.env.NODE_ENV === "development" && process.env.REACT_APP_BASE_ADT_URL) {
          signalRUrl = process.env.REACT_APP_BASE_ADT_URL + signalRUrl;
        }

        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(signalRUrl, {
            accessTokenFactory: () => accessToken
          })
          .build();

        await this.connection.start();
      } catch (e) {
        print(`Failed to connect to SignalR: ${e}`, "error");
      }
    }
  }

  async subscribe(action, callback) {
    if (this.connection) {
      this.connection.on(action, callback);
    } else {
      await this.initialize();
      this.connection.on(action, callback);
    }
  }

}

export const signalRService = new SignalRService();
