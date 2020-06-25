// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { TokenCredentials } from "@azure/ms-rest-js";
import { AzureDigitalTwinsAPI } from "./lib/azureDigitalTwinsAPI";
import { authService } from "./AuthService";
import { configService } from "./ConfigService";
import { print } from "./LoggingService";
import { settingsService } from "./SettingsService";
import { BatchService } from "./BatchService";
import { REL_TYPE_OUTGOING, REL_TYPE_INCOMING, REL_TYPE_ALL } from "./Constants";

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

class ApiService {

  constructor() {
    this.client = null;
    this.clientOptions = null;
  }

  async initialize() {
    const accessToken = await authService.login();
    if (!accessToken) {
      throw new Error("Failed to acquire access token");
    }

    const tokenCredentials = new TokenCredentials(accessToken);

    const clientConfig = {
      baseUri: `${window.location.origin}/api/proxy`
    };

    // Add token and server url to service instance
    this.client = new AzureDigitalTwinsAPI(tokenCredentials, clientConfig);

    const { appAdtUrl } = await configService.getConfig();
    this.clientOptions = { customHeaders: { "x-adt-host": new URL(appAdtUrl).hostname } };
  }

  async queryTwinsPaged(query, callback) {
    await this.initialize();

    let page = 1;
    let continuationToken = null;
    do {
      const response = await this.client.query.queryTwins({ query, continuationToken }, this.clientOptions);
      print(`Ran query for twins, page ${page}:`, "info");
      print(JSON.stringify(response.items, null, 2), "info");
      await callback(getTwinsFromQueryResponse(response.items));

      continuationToken = response.continuationToken;
      page++;
    } while (continuationToken);
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

    const response = await this.client.digitalTwins.getById(twinId, this.clientOptions);
    return response.body;
  }

  async addTwin(twinId, payload) {
    await this.initialize();

    return await this.client.digitalTwins.add(twinId, payload, this.clientOptions);
  }

  async updateTwin(twinId, patch) {
    await this.initialize();

    return await this.client.digitalTwins.update(twinId, patch, this.clientOptions);
  }

  async queryRelationshipsPaged(twinId, callback, type = REL_TYPE_OUTGOING) {
    await this.initialize();

    const operations = type === REL_TYPE_ALL ? [ REL_TYPE_OUTGOING, REL_TYPE_INCOMING ] : [ type ];
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      const isFinalOp = i === operations.length - 1;

      let page = 1;
      let nextLink = null;
      do {
        const baseOperationName = `list${op === REL_TYPE_INCOMING ? "Incoming" : ""}Relationships`;
        const response = nextLink
          ? await this.client.digitalTwins[`${baseOperationName}Next`](`${this.client.baseUri}${nextLink}`, this.clientOptions)
          : await this.client.digitalTwins[baseOperationName](twinId, this.clientOptions);
        print(`Ran query for relationships for twin ${twinId}, page ${page}:`, "info");
        print(JSON.stringify(response, null, 2), "info");

        // The response type for the incoming relationships doesn't match the outgoing call so we'll remap it
        if (op === REL_TYPE_INCOMING) {
          response.forEach(x => {
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
        const callbackResponse = [ ...response ];
        if (response.nextLink || !isFinalOp) {
          callbackResponse.nextLink = true;
        }

        await callback(callbackResponse);

        nextLink = response.nextLink;
        page++;
      } while (nextLink);
    }
  }

  async queryRelationships(twinId, type = REL_TYPE_OUTGOING) {
    const list = [];
    await this.queryRelationshipsPaged(twinId, items => items.forEach(x => list.push(x)), type);

    return list;
  }

  async addRelationship(sourceId, targetId, relationshipType, relationshipId) {
    await this.initialize();

    return await this.client.digitalTwins.addRelationship(sourceId, relationshipId,
      { relationship: { $relationshipName: relationshipType, $targetId: targetId }, ...this.clientOptions });
  }

  async queryModelsPaged(callback) {
    await this.initialize();

    let page = 1;
    let nextLink = null;
    do {
      print(`Running query for models: page ${page}`, "info");

      const response = nextLink
        ? await this.client.digitalTwinModels.listNext(`${this.client.baseUri}${nextLink}`, this.clientOptions)
        : await this.client.digitalTwinModels.list({ includeModelDefinition: true, ...this.clientOptions });
      await callback(response);

      nextLink = response.nextLink;
      page++;
    } while (nextLink);
  }

  async queryModels() {
    const list = [];
    await this.queryModelsPaged(items => items.forEach(x => list.push(x)));

    return list;
  }

  async getModelById(modelId) {
    await this.initialize();

    return this.client.digitalTwinModels.getById(modelId, { includeModelDefinition: true, ...this.clientOptions });
  }

  async addModels(models) {
    await this.initialize();

    return await this.client.digitalTwinModels.add({ models, ...this.clientOptions });
  }

  async deleteRelationship(twinId, relationshipId) {
    await this.initialize();

    print(`Deleting relationship ${relationshipId} for twin ${twinId}`, "warning");
    await this.client.digitalTwins.deleteRelationship(twinId, relationshipId, this.clientOptions);
  }

  async deleteTwin(twinId, skipRelationships = false) {
    if (!skipRelationships) {
      await this.deleteTwinRelationships(twinId);
    }

    print(`Deleting twin ${twinId}`, "warning");
    await this.client.digitalTwins.deleteMethod(twinId, this.clientOptions);
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
    await this.client.digitalTwinModels.deleteMethod(id, this.clientOptions);
    print(`*** Delete complete for model with ID: ${id}`, "warning");
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
