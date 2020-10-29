// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DigitalTwinsClient } from "@azure/digital-twins-core";
import { DefaultHttpClient } from "@azure/core-http";
import { BatchService } from "./BatchService";
import { configService } from "./ConfigService";
import { REL_TYPE_ALL, REL_TYPE_INCOMING, REL_TYPE_OUTGOING } from "./Constants";
import { print } from "./LoggingService";
import { settingsService } from "./SettingsService";

const getAllTwinsQuery = "SELECT * FROM digitaltwins";

const getTwinsFromQueryResponse = response => {
  const list = [ ...response ];
  const twins = [];
  for (let i = 0; i < list.length; i++) {
    const current = list[i];
    if (current.$dtId) {
      twins.push(current);
      continue;
    }

    for (const k of Object.keys(current)) {
      const v = current[k];
      if (typeof v === "object") {
        list.push(v);
      } else if (Array.isArray(v)) {
        v.forEach(x => list.push(x));
      }
    }
  }

  return twins;
};

class CustomHttpClient {

  constructor(options) {
    this.client = new DefaultHttpClient();
    this.options = options;
  }

  sendRequest(httpRequest) {
    if (this.options && this.options.customHeaders) {
      for (const key in this.options.customHeaders) {
        if (Object.prototype.hasOwnProperty.call(this.options.customHeaders, key)) {
          httpRequest.headers.set(key, this.options.customHeaders[key]);
        }
      }
    }

    return this.client.sendRequest(httpRequest);
  }

}

class ApiService {

  constructor() {
    this.client = null;
  }

  async initialize() {
    const { appAdtUrl } = await configService.getConfig();

    const nullTokenCredentials = {
      getToken: () => null
    };

    const baseUri = `${window.location.origin}/api/proxy`;
    const httpClient = new CustomHttpClient({ customHeaders: { "x-adt-host": new URL(appAdtUrl).hostname } });
    this.client = new DigitalTwinsClient(baseUri, nullTokenCredentials, { httpClient });
  }

  async queryTwinsPaged(query, callback) {
    await this.initialize();
    
    let count = 1;
    for await (const page of this.client.queryTwins(query).byPage()) {
      print(`Ran query for twins, page ${count++}:`, "info");
      print(JSON.stringify(page, null, 2), "info");
      await callback(getTwinsFromQueryResponse(page.value));
    }
  }

  async queryTwins(query) {
    const list = [];
    await this.queryTwinsPaged(query, items => items.forEach(x => list.push(x)));

    return list;
  }

  async getAllTwins() {
    return await this.queryTwins(getAllTwinsQuery);
  }

  async getTwinById(twinId) {
    await this.initialize();

    const response = await this.client.getDigitalTwin(twinId);
    return response.body;
  }

  async addTwin(twinId, payload) {
    await this.initialize();

    return await this.client.upsertDigitalTwin(twinId, payload);
  }

  async updateTwin(twinId, patch) {
    await this.initialize();

    return await this.client.updateDigitalTwin(twinId, patch);
  }

  async queryRelationshipsPaged(twinId, callback, type = REL_TYPE_OUTGOING) {
    await this.initialize();

    const operations = type === REL_TYPE_ALL ? [ REL_TYPE_OUTGOING, REL_TYPE_INCOMING ] : [ type ];
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      const isFinalOp = i === operations.length - 1;
      const baseOperationName = `list${op === REL_TYPE_INCOMING ? "Incoming" : ""}Relationships`;

      let count = 1;
      for await (const page of this.client[baseOperationName](twinId).byPage()) {
        print(`Ran query for relationships for twin ${twinId}, page ${count++}:`, "info");
        print(JSON.stringify(page, null, 2), "info");

        // The response type for the incoming relationships doesn't match the outgoing call so we'll remap it
        if (op === REL_TYPE_INCOMING) {
          page.value.forEach(x => {
            [ "sourceId", "relationshipId", "relationshipName", "relationshipLink" ]
              .filter(y => !!x[y])
              .forEach(y => {
                x[`$${y}`] = x[y];
                delete x[y];
              });
            x.$targetId = twinId;
          });
        }

        // Indicate to the caller that we're not done in the case where we are calling multiple operations
        const callbackResponse = [ ...page.value ];
        if (page.nextLink || !isFinalOp) {
          callbackResponse.nextLink = true;
        }

        await callback(callbackResponse);
      }
    }
  }

  async queryRelationships(twinId, type = REL_TYPE_OUTGOING) {
    const list = [];
    await this.queryRelationshipsPaged(twinId, items => items.forEach(x => list.push(x)), type);

    return list;
  }

  async addRelationship(sourceId, targetId, relationshipType, relationshipId) {
    await this.initialize();

    return await this.client.upsertRelationship(sourceId, relationshipId,
      { $relationshipName: relationshipType, $targetId: targetId });
  }

  async queryModels() {
    await this.initialize();

    const list = [];
    const models = this.client.listModels([], true);
    for await (const model of models) {
      list.push(model);
    }

    return list;
  }

  async getModelById(modelId) {
    await this.initialize();

    return await this.client.getModel(modelId, true);
  }

  async addModels(models) {
    await this.initialize();

    return await this.client.createModels(models);
  }

  async deleteRelationship(twinId, relationshipId) {
    await this.initialize();

    print(`Deleting relationship ${relationshipId} for twin ${twinId}`, "warning");
    await this.client.deleteRelationship(twinId, relationshipId);
  }

  async deleteTwin(twinId, skipRelationships = false) {
    if (!skipRelationships) {
      await this.deleteTwinRelationships(twinId);
    }

    print(`Deleting twin ${twinId}`, "warning");
    await this.client.deleteDigitalTwin(twinId);
  }

  async deleteTwinRelationships(twinId, skipIncoming = false) {
    await this.initialize();

    const rels = await this.queryRelationships(twinId, REL_TYPE_OUTGOING);
    for (const r of rels) {
      await this.deleteRelationship(twinId, r.$relationshipId);
    }

    if (!skipIncoming) {
      const incRels = await this.queryRelationships(twinId, REL_TYPE_INCOMING);
      for (const r of incRels) {
        await this.deleteRelationship(r.$sourceId, r.$relationshipId);
      }
    }
  }

  async deleteAllTwins(ids) {
    await this.initialize();

    const relsBs = new BatchService({
      items: ids,
      action: (item, resolve, reject) => {
        this.deleteTwinRelationships(item, true)
          .then(resolve, reject);
      }
    });
    await relsBs.run();

    const twinsBs = new BatchService({
      items: ids,
      action: (item, resolve, reject) => {
        this.deleteTwin(item, true)
          .then(resolve, reject);
      }
    });
    await twinsBs.run();

    print("*** Delete complete", "warning");
  }

  async deleteModel(id) {
    await this.initialize();
    await this.client.deleteModel(id);
    print(`*** Delete complete for model with ID: ${id}`, "warning");
  }

  async getRelationship(sourceTwinId, relationshipId) {
    print(`Get relationship with id ${relationshipId} for source twin ${sourceTwinId}`, "info");
    await this.initialize();
    return await this.client.getRelationship(sourceTwinId, relationshipId);
  }

  async getEventRoutes() {
    print(`Get event routes`, "info");
    await this.initialize();

    const list = [];
    const eventRoutes = this.client.listEventRoutes();
    for await (const eventRoute of eventRoutes) {
      list.push(eventRoute);
    }
    return list;
  }

  async getEventRoute(routeId) {
    print(`Get event route with id ${routeId}`, "info");
    await this.initialize();
    return await this.client.getEventRoute(routeId);
  }

  async addEventRoute(routeId, endpointId, filter) {
    print(`Adding event route with id ${routeId}`, "info");
    await this.initialize();
    const eventRoute = { id: routeId, endpointId, filter };
    return await this.client.upsertEventRoute(routeId, { options: eventRoute });
  }

  async deleteEventRoute(routeId) {
    print(`Deleting event route with id ${routeId}`, "warning");
    await this.initialize();
    await this.client.deleteEventRoute(routeId);
    print(`*** Delete complete for event route with ID: ${routeId}`, "warning");
  }

  async decommissionModel(modelId) {
    print(`Decommission model with ID: ${modelId}`, "info");
    await this.initialize();
    await this.client.decomissionModel(modelId);
  }

}

class CachedApiService extends ApiService {

  constructor() {
    super();
    this.cache = { relationships: {}, models: [] };
  }

  async addModels(models) {
    this.cache.models = [];
    return await super.addModels(models);
  }

  async deleteModel(id) {
    this.cache.models = [];
    return await super.deleteModel(id);
  }

  async getModelById(id) {
    if (!settingsService.caching) {
      this.clearCache();
      return await super.getModelById(id);
    }

    if (this.cache.models.length <= 0) {
      await this.updateModelCache();
    }
    return this.cache.models.find(m => m.id === id);
  }

  async queryModels() {
    if (!settingsService.caching) {
      this.clearCache();
      return await super.queryModels();
    }

    if (this.cache.models.length <= 0) {
      await this.updateModelCache();
    }
    return this.cache.models;
  }

  async deleteAllTwins(ids) {
    this.cache.relationships = {};
    return await super.deleteAllTwins(ids);
  }

  async updateModelCache() {
    const models = await super.queryModels();
    this.cache.models = models;
  }

  async addRelationship(sourceId, targetId, relationshipType, relationshipId) {
    for (const id of [ sourceId, targetId ]) {
      if (this.cache.relationships[id]) {
        delete this.cache.relationships[id];
      }
    }
    return await super.addRelationship(sourceId, targetId, relationshipType, relationshipId);
  }

  async deleteRelationship(twinId, relationshipId) {
    if (this.cache.relationships[twinId]) {
      delete this.cache.relationships[twinId];
    }
    return await super.deleteRelationship(twinId, relationshipId);
  }

  async queryRelationshipsPaged(twinId, callback, type = REL_TYPE_OUTGOING) {
    if (!settingsService.caching) {
      this.clearCache();
      await super.queryRelationshipsPaged(twinId, callback, type);
      return;
    }

    let results = this.cache.relationships[twinId];
    if (results && results[type]) {
      callback(results[type]);
      return;
    }

    if (!results) {
      this.cache.relationships[twinId] = {};
    }

    results = [];
    await super.queryRelationshipsPaged(twinId, async items => {
      items.forEach(x => results.push(x));
      await callback(items);
    }, type);

    this.cache.relationships[twinId][type] = results;
  }

  clearCache() {
    this.cache.relationships = {};
    this.cache.models = [];
  }

}

export const apiService = new CachedApiService();
