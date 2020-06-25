// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ExcelRenderer as excelRenderer } from "react-excel-renderer";
import { v4 as uuidv4 } from "uuid";

import { DataModel } from "../models/DataModel";

const ModelColumn = "model",
  IdColumn = "id",
  RelationshipFromColumn = "relFrom",
  RelationshipTypeColumn = "relType",
  InitialDataColumn = "initData";

const ColumnMapping = [
  { name: "ModelID", id: ModelColumn },
  { name: "ID (must be unique)", id: IdColumn },
  { name: "Relationship (From)", id: RelationshipFromColumn },
  { name: "Relationship Name", id: RelationshipTypeColumn },
  { name: "Init Data", id: InitialDataColumn }
];

class StandardExcelImportFormat {

  getData(resp) {
    const headers = this._mapHeaders(resp.rows[0]);
    if (!headers) {
      return null;
    }

    const data = new DataModel();

    for (let i = 1; i < resp.rows.length; i++) {
      const row = resp.rows[i];

      const twinId = row[headers[IdColumn]];
      if (!twinId) {
        throw new Error(`Missing twin ID on row ${i}`);
      }

      const modelId = row[headers[ModelColumn]];
      const initDataRaw = row[headers[InitialDataColumn]];
      const initData = initDataRaw ? JSON.parse(initDataRaw) : {};
      initData.$metadata = { $model: modelId };
      if (modelId) {
        data.digitalTwinsGraph.digitalTwins.push({ $dtId: twinId, ...initData });
      }

      const parent = row[headers[RelationshipFromColumn]];
      const relationship = row[headers[RelationshipTypeColumn]];
      if (parent && relationship) {
        data.digitalTwinsGraph.relationships.push({
          $sourceId: parent,
          $targetId: twinId,
          $relationshipName: relationship,
          $relationshipId: uuidv4()
        });
      }
    }

    return data;
  }

  _mapHeaders(row) {
    const mapping = ColumnMapping.reduce((p, c) => {
      const index = row.findIndex(x => x === c.name);
      if (index >= 0) {
        p[c.id] = index;
      }

      return p;
    }, {});

    return Object.keys(mapping).length === ColumnMapping.length ? mapping : null;
  }

}

export class ExcelImportPlugin {

  async tryLoad(file) {
    if (!file.name.endsWith(".xlsx")) {
      return false;
    }

    const results = await new Promise((resolve, reject) => {
      excelRenderer(file, (err, resp) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(resp);
      });
    });

    const data = new StandardExcelImportFormat().getData(results);
    if (!data) {
      throw new Error(`Failed to parse format`);
    }

    return data;
  }

}
