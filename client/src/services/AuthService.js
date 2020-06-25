// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as Msal from "msal";
import { configService } from "./ConfigService";
import { eventService } from "./EventService";

const invokeWithLoading = async callback => {
  let response = null;
  try {
    eventService.publishLoading(true);
    response = await callback();
  } catch (e) {
    eventService.publishLoading(false);
    throw e;
  }

  eventService.publishLoading(false);
  return response;
};

class AuthService {

  constructor() {
    this.msalInstance = null;
    this.loggedIn = false;
  }

  async login(force) {
    const { appClientId, appTenantId } = await configService.getConfig(force);
    this.msalInstance = this.getMsalInstance(appClientId, appTenantId);

    const loginRequest = { scopes: [ "https://digitaltwins.azure.net/.default" ] };

    let accessToken = null;

    if (force || !this.msalInstance.getAccount()) {
      await invokeWithLoading(async () => await this.msalInstance.loginPopup(loginRequest));
    }

    // If the user is already logged in you can acquire a token
    if (this.msalInstance.getAccount()) {
      try {
        const response = await this.msalInstance.acquireTokenSilent(loginRequest);
        accessToken = response.accessToken;
      } catch (err) {
        // Could also check if err instance of InteractionRequiredAuthError if you can import the class
        if (err.name === "InteractionRequiredAuthError") {
          const response = await invokeWithLoading(async () => await this.msalInstance.acquireTokenPopup(loginRequest));
          accessToken = response.accessToken;
        }
      }
    }

    if (accessToken) {
      if (!this.loggedIn) {
        eventService.publishLogin();
        this.loggedIn = true;
      }
    }

    return accessToken;
  }

  logout() {
    if (!!this.msalInstance && this.msalInstance.getAccount()) {
      this.msalInstance.logout();
    }
  }

  reset() {
    this.msalInstance = null;
    this.loggedIn = false;
  }

  get isLoggedIn() {
    return !!this.msalInstance && !!this.msalInstance.getAccount();
  }

  getMsalInstance = (clientId, tenantId) => {
    const msalConfig = {
      auth: {
        clientId,
        redirectUri: window.location.origin,
        authority: `https://login.microsoftonline.com/${tenantId}`
      }
    };

    return new Msal.UserAgentApplication(msalConfig);
  }

}

export const authService = new AuthService();
