// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { apiService } from "./ApiService";
import { BatchService } from "./BatchService";
import { DataModel } from "./models/DataModel";

class ExportService {

  async save(query) {
    const data = new DataModel();
    data.digitalTwinsGraph.digitalTwins = (await apiService.queryTwins(query))
      .map(x => {
        x.$metadata = { $model: x.$metadata.$model };
        return x;
      });

    const bs = new BatchService({
      items: data.digitalTwinsGraph.digitalTwins,
      action: (twin, resolve) => {
        apiService.queryRelationshipsPaged(twin.$dtId, rels => {
          const presentRels = rels.filter(x =>
            data.digitalTwinsGraph.digitalTwins.some(y => y.$dtId === x.$sourceId)
              && data.digitalTwinsGraph.digitalTwins.some(y => y.$dtId === x.$targetId));
          presentRels.forEach(x => data.digitalTwinsGraph.relationships.push(x));
          if (!rels.nextLink) {
            resolve();
          }
        });
      }
    });
    await bs.run();

    // eslint-disable-next-line require-atomic-updates
    data.digitalTwinsModels = (await apiService.queryModels()).map(x => x.model);
    return data;
  }

}

export const exportService = new ExportService();
