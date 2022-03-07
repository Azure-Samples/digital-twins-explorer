// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ExcelImportPlugin } from "./plugins/ExcelImportPlugin";
import { JsonImportPlugin } from "./plugins/JsonImportPlugin";
import { apiService } from "./ApiService";
import { ModelService } from "./ModelService";
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

  formatJsonNumberIntoString = data => {
    for (const twin of data.digitalTwinsGraph.digitalTwins) {
      if (typeof twin.$dtId === "number") {
        twin.$dtId = twin.$dtId.toString();
      }
    }
  }

  async save(data) {
    this.formatJsonNumberIntoString(data);
    let dataImported = false;
    if (data.digitalTwinsModels && data.digitalTwinsModels.length > 0) {
      await this.saveModels(data);
      dataImported = true;
    }
    if ((data.digitalTwinsGraph.digitalTwins && data.digitalTwinsGraph.digitalTwins.length > 0)
          || (data.digitalTwinsGraph.relationships && data.digitalTwinsGraph.relationships.length > 0)) {
      await this.saveData(data);
      dataImported = true;
    }
    return dataImported;
  }

  async saveModels(data) {
    const modelService = new ModelService();
    const currentModels = await apiService.queryModels();
    const sortedModelsId = await modelService.getModelIdsForUpload(data.digitalTwinsModels);
    let sortedModels = sortedModelsId.map(id => data.digitalTwinsModels.filter(model => model["@id"] === id)[0]);
    sortedModels = sortedModels.filter(model => !currentModels.some(item => item.id === model["@id"]));
    if (sortedModels.length > 0) {
      const chunks = modelService.chunkModelsList(sortedModels, 50);
      for (const chunk of chunks) {
        await apiService.addModels(chunk);
      }
    }
  }

  async saveData(data) {
    const results = { twins: [], relationships: [] };
    await apiService.initialize();
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
          apiService.addRelationship(item.$sourceId, item.$targetId, item.$relationshipName, item.$relationshipId, item.$properties)
            .then(resolve, e => {
              print(`*** Error in creating relationship: ${e}`, "error");
              results.relationships.push({ ...item, $errorMessage: e.details.error.details ? e.details.error.details[0].message : e.details.error.message });
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
          `${x.$sourceId} ${x.$targetId} \n${x.$errorMessage}`).join(", ")}`
        : "";
      const msg = `Failed to create ${twins}${joiner}${rels}`;
      throw new Error(msg);
    }
  }

}

export const importService = new ImportService();
