// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { configService } from "./ConfigService";
import { TWIN_DATA_OWNER_RBAC_ID } from "./Constants";

class RBACService {

  async addReaderRBAC() {
    // Function to generate a random GUID
    function uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        /* eslint no-bitwise: [2, { allow: ["|"] }] */
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r | 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Get our current twins instance from settings
    const { appAdtUrl } = await configService.getConfig();
    const requestParams = {
      "appName": appAdtUrl.split(".api.")[0].substring(8)
    };
    // Get the user's principal ID
    const requestOptions = {
      method: "GET",
      headers: {
        "x-adt-host": "graph.microsoft.com"
      }
    };
    return fetch("http://localhost:3000/api/proxy/Graph/v1.0/me", requestOptions)
      .then(response => response.json())
      .then(result => {
        requestParams.userId = result.id;
        return requestParams;
      })
      .then(userParams => {
        // Get subscriptions from logged in user
        const userOptions = {
          method: "GET",
          headers: {
            "x-adt-host": "management.azure.com"
          }
        };
        return fetch("http://localhost:3000/api/proxy/RBAC/subscriptions?api-version=2020-01-01", userOptions)
          .then(response => response.json())
          .then(result => {
            userParams.subscriptions = result;
            return userParams;
          });
      })
      .then(subscriptionParams => {
        // Loop through our subscriptions to get the twins instance
        const subscriptionOptions = {
          method: "GET",
          headers: {
            "x-adt-host": "management.azure.com"
          }
        };

        const subscriptionRequests = [];
        for (const x of subscriptionParams.subscriptions.value) {
          subscriptionRequests.push(
            fetch(`http://localhost:3000/api/proxy/RBAC${x.id}/providers/Microsoft.DigitalTwins/digitalTwinsInstances?api-version=2020-10-31`, subscriptionOptions)
              .then(response => response.json())
              .then(result => {
                if ("value" in result && result.value !== false) {
                  for (const value in result.value) {
                    if (result.value[value].name.toLowerCase() === subscriptionParams.appName.toLowerCase()) {
                      subscriptionParams.ARMId = result.value[value].id;
                      return subscriptionParams;
                    }
                  }
                }
                return 0;
              })
              .then(roleParams => {
                if (roleParams === 0) {
                  return false;
                }
                // POST request using fetch with set headers
                const roleOptions = {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "x-adt-host": "management.azure.com"
                  },
                  body: JSON.stringify({
                    "properties": {
                      "principalId": `${roleParams.userId}`,
                      "roleDefinitionId": `${roleParams.ARMId}/providers/Microsoft.Authorization/roleDefinitions/${TWIN_DATA_OWNER_RBAC_ID}`
                    }
                  })
                };
                return fetch(`http://localhost:3000/api/proxy/RBAC${roleParams.ARMId}/providers/Microsoft.Authorization/roleAssignments/${uuidv4()}?api-version=2020-04-01-preview`, roleOptions);
              }
              )
          );
        }
        return Promise.all(subscriptionRequests);
      });
  }

}

export const rbacService = new RBACService();
