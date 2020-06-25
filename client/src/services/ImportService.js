// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ExcelImportPlugin } from "./plugins/ExcelImportPlugin";
import { JsonImportPlugin } from "./plugins/JsonImportPlugin";
import { apiService } from "./ApiService";
import { print } from "./LoggingService";
import { BatchService } from "./BatchService";

const ImportPlugins = [ ExcelImportPlugin, JsonImportPlugin ];

class ImportService {

  async tryLoad(file) {
    for (const P of ImportPlugins) {
      const plugin = new P();
      const result = plugin.tryLoad && await plugin.tryLoad(file);
      if (result) {
        return result;
      }
    }

    return null;
  }

  async save(data) {
    if (data.digitalTwinsModels.length > 0) {
      await this.saveModels(data);
    }
    if (data.digitalTwinsGraph.digitalTwins.length > 0 || data.digitalTwinsGraph.relationships.length > 0) {
      await this.saveData(data);
    }
  }

  async saveModels(data) {
    const currentModels = await apiService.queryModels();
    const missingModels = data.digitalTwinsModels.filter(x => currentModels.every(y => x["@id"] !== y.model["@id"]));
    if (missingModels.length > 0) {
      await apiService.addModels(missingModels);
    }
  }

  async saveData(data) {
    const results = { twins: [], relationships: [] };

    const twinsBs = new BatchService({
      items: data.digitalTwinsGraph.digitalTwins,
      action: (item, resolve, reject) => {
        print(`- Create twin ${item.$dtId}`);
        apiService.addTwin(item.$dtId, item)
          .then(resolve, e => {
            print(`*** Error in creating twin: ${e}`, "error");
            results.twins.push(item);
            reject(e);
          });
      }
    });
    await twinsBs.run();

    const groupedRels = data.digitalTwinsGraph.relationships.reduce((p, c) => {
      (p[c.$relationshipName] = p[c.$relationshipName] || []).push(c);
      return p;
    }, {});
    for (const rel of Object.keys(groupedRels)) {
      const relBs = new BatchService({
        items: groupedRels[rel],
        action: (item, resolve, reject) => {
          print(`- Create relationship ${item.$relationshipName} from ${item.$sourceId} to ${item.$targetId}`);
          apiService.addRelationship(item.$sourceId, item.$targetId, item.$relationshipName, item.$relationshipId)
            .then(resolve, e => {
              print(`*** Error in creating relationship: ${e}`, "error");
              results.relationships.push(item);
              reject(e);
            });
        }
      });
      await relBs.run();
    }

    if (results.twins.length > 0 || results.relationships.length > 0) {
      const twins = results.twins.length > 0 ? `twins ${results.twins.map(x => x.$dtId).join(", ")}` : "";
      const joiner = results.twins.length > 0 && results.relationships.length > 0 ? " and " : "";
      const rels = results.relationships.length > 0
        ? `relationships ${results.relationships.map(x =>
          `${x.$sourceId} ${x.$relationship} ${x.$targetId}`).join(", ")}`
        : "";
      const msg = `Failed to create ${twins}${joiner}${rels}`;
      throw new Error(msg);
    }
  }

}

export const importService = new ImportService();
