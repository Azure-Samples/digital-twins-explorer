// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as signalR from "@microsoft/signalr";

import { configService } from "./ConfigService";
import { eventService } from "./EventService";
import { print } from "./LoggingService";

class SignalRService {

  async initialize() {
    if (!this.connection) {
      try {
        const { appAdtUrl } = await configService.getConfig();

        if (!appAdtUrl) {
          return;
        }

        let signalRUrl = `/api/signalr/?x-adt-host=${new URL(appAdtUrl).hostname}`;
        if (process.env.NODE_ENV === "development" && process.env.REACT_APP_BASE_ADT_URL) {
          signalRUrl = process.env.REACT_APP_BASE_ADT_URL + signalRUrl;
        }

        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(signalRUrl)
          .build();

        await this.connection.start();
      } catch (e) {
        print(`Failed to connect to SignalR: ${e}`, "error");
      }
    }
  }

  async subscribe(action, callback) {
    try {
      if (this.connection) {
        this.connection.on(action, callback);
      } else {
        await this.initialize();
        this.connection.on(action, callback);
      }
    } catch (exc) {
      exc.customMessage = "";
      eventService.publishError(exc);
    }
  }

}

export const signalRService = new SignalRService();
