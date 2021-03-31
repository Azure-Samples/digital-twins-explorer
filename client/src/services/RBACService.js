// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { print } from "./LoggingService";
import { configService } from "./ConfigService";
import { TWIN_DATA_OWNER_RBAC_ID } from "./Constants";

class RBACService {

  uuidv4() {
    // Function to generate a random GUID
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      /* eslint no-bitwise: [2, { allow: ["|"] }] */
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r | 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getIdentity(path) {
    const userOptions = {
      method: "GET",
      headers: {
        "x-adt-host": "graph.microsoft.com"
      }
    };
    const results = await fetch(`/api/proxy/Graph/${path}`, userOptions);
    return await results.json();
  }

  async getRBAC(path) {
    const userOptions = {
      method: "GET",
      headers: {
        "x-adt-host": "management.azure.com"
      }
    };
    const results = await fetch(`/api/proxy/RBAC/${path}`, userOptions);
    return await results.json();
  }

  async postRBACRole(userPrincipalId, twinARMId) {
    const userOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-adt-host": "management.azure.com"
      },
      body: JSON.stringify({
        "properties": {
          "principalId": `${userPrincipalId}`,
          "roleDefinitionId": `${twinARMId}/providers/Microsoft.Authorization/roleDefinitions/${TWIN_DATA_OWNER_RBAC_ID}`
        }
      })
    };
    return await fetch(`/api/proxy/RBAC${twinARMId}/providers/Microsoft.Authorization/roleAssignments/${this.uuidv4()}?api-version=2020-04-01-preview`, userOptions);
  }

  async postTwinsAccess(appName, subId, userPrincipalId) {
    // Get the twins from a given subscription
    const result = await this.getRBAC(`${subId}/providers/Microsoft.DigitalTwins/digitalTwinsInstances?api-version=2020-10-31`);

    // Check if our twin is in the list of all twins in that subscription
    let ARMId = null;
    if ("value" in result && result.value !== false) {
      for (const value of result.value) {
        if (value.name.toLowerCase() === appName.toLowerCase()) {
          ARMId = value.id;
        }
      }
    }
    if (ARMId === null) {
      return false;
    }
    return await this.postRBACRole(userPrincipalId, ARMId);
  }

  async addReaderRBAC() {
    try {
      // Get our current twins instance from settings
      const { appAdtUrl } = await configService.getConfig();
      const requestParams = {
        "appName": new URL(appAdtUrl).host.split(".")[0]
      };

      // Get the user's principal ID
      const me = await this.getIdentity("v1.0/me");
      requestParams.userId = me.id;

      // Get the user's logged in subscriptions
      const subscriptions = await this.getRBAC("subscriptions?api-version=2020-01-01");
      requestParams.subscriptions = subscriptions;

      // Loop through our subscriptions to get the twins instance
      const subscriptionRequests = [];
      for (const x of requestParams.subscriptions.value) {
        subscriptionRequests.push(this.postTwinsAccess(requestParams.appName, x.id, requestParams.userId));
      }
      return Promise.all(subscriptionRequests);
    } catch (e) {
      print(e, "error");
      return false;
    }
  }

}

export const rbacService = new RBACService();
