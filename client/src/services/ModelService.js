// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { JsonldGraph } from "jsonld-graph";

import { apiService } from "./ApiService";
import context from "./ref/context";

const REL_TARGET_ANY = "*";
const getPropertyName = vertex => vertex.getAttributeValue("dtmi:dtdl:property:name;2");
const getPropertyWriteable = vertex => vertex.getAttributeValue("dtmi:dtdl:property:writeable;2");

const inferTarget = vertex => {
  const targetEdge = vertex.getOutgoing("dtmi:dtdl:property:target;2").first();
  return targetEdge ? targetEdge.toVertex.id : REL_TARGET_ANY;
};

const inferSchema = vertex => {
  const schemaEdge = vertex.getOutgoing("dtmi:dtdl:property:schema;2").first();
  if (!schemaEdge) {
    return null;
  }

  if (schemaEdge.toVertex.isType("dtmi:dtdl:class:Object;2")) {
    return {
      type: "Object",
      fields: [ ...schemaEdge.toVertex.getOutgoing("dtmi:dtdl:property:fields;2")
        .map(edge => ({
          name: getPropertyName(edge.toVertex),
          schema: inferSchema(edge.toVertex)
        }))
        .filter(edge => !!edge.schema) ]
    };
  }

  if (schemaEdge.toVertex.isType("dtmi:dtdl:class:Enum;2")) {
    return {
      type: "Enum",
      values: [ ...schemaEdge.toVertex.getOutgoing("dtmi:dtdl:property:enumValues;2").map(edge => ({
        name: getPropertyName(edge.toVertex),
        value: edge.toVertex.getAttributeValue("dtmi:dtdl:property:enumValue;2")
      })) ]
    };
  }

  return schemaEdge.toVertex.id;
};

export class ModelService {

  constructor() {
    this.modelGraph = null;
  }

  async initialize() {
    if (!this.modelGraph) {
      const models = await apiService.queryModels();
      this.modelGraph = new JsonldGraph([
        { uri: "dtmi:dtdl:context;2", context }
      ]);
      await this.modelGraph.load(models.map(x => x.model));
    }
  }

  async getRelationships(sourceModelId, targetModelId) {
    await this.initialize();
    const sourceModel = this._getModel(sourceModelId);
    const targetModel = this._getModel(targetModelId);
    return sourceModel
      .relationships
      .filter(x => x.target === REL_TARGET_ANY || x.target === targetModelId || targetModel.bases.some(y => y === x.target))
      .map(x => x.name);
  }

  async getProperties(sourceModelId) {
    await this.initialize();
    const sourceModel = this._getModel(sourceModelId);
    return sourceModel.properties;
  }

  async getTelemetries(sourceModelId) {
    await this.initialize();
    const sourceModel = this._getModel(sourceModelId);
    return sourceModel.telemetries;
  }

  async getBases(modelId) {
    await this.initialize();
    const sourceModel = this._getModel(modelId);
    return sourceModel.bases;
  }

  async deleteAll() {
    await this.initialize();
    const models = this.modelGraph.getVertices(x => x.isType("dtmi:dtdl:class:Interface;2")).items();

    while (models.length > 0) {
      const referenced = {};
      for (const m of models) {
        m.getOutgoing("dtmi:dtdl:property:extends;2")
          .filter(x => x.toVertex.isType("dtmi:dtdl:class:Interface;2"))
          .items()
          .forEach(x => referenced[x.toVertex.id] = x.toVertex);
      }

      for (const m of models.filter(x => !referenced[x.id])) {
        await apiService.deleteModel(m.id);
        models.splice(models.indexOf(m), 1);
      }
    }
  }

  createPayload(modelId) {
    return { $metadata: { $model: modelId } };
  }

  _getModel(modelId) {
    const contents = { properties: [], relationships: [], telemetries: [], bases: [] };
    const model = this.modelGraph.getVertex(modelId);
    if (model) {
      this._mapModel(model, contents);
    }

    return contents;
  }

  _mapModel(vertex, contents) {
    const safeAdd = (collection, item) => Object.keys(item).every(x => item[x] !== null) && collection.push(item);

    vertex
      .getOutgoing("dtmi:dtdl:property:contents;2")
      .items()
      .forEach(x => {
        if (x.toVertex.isType("dtmi:dtdl:class:Property;2")) {
          safeAdd(contents.properties, {
            name: getPropertyName(x.toVertex),
            schema: inferSchema(x.toVertex),
            writeable: getPropertyWriteable(x.toVertex)
          });
        }

        if (x.toVertex.isType("dtmi:dtdl:class:Telemetry;2")) {
          safeAdd(contents.telemetries, {
            name: getPropertyName(x.toVertex),
            schema: inferSchema(x.toVertex)
          });
        }

        if (x.toVertex.isType("dtmi:dtdl:class:Relationship;2")) {
          safeAdd(contents.relationships, {
            name: getPropertyName(x.toVertex),
            target: inferTarget(x.toVertex)
          });
        }
      });

    vertex
      .getOutgoing("dtmi:dtdl:property:extends;2")
      .items()
      .forEach(x => {
        contents.bases.push(x.toVertex.id);
        this._mapModel(x.toVertex, contents);
      });
  }

}
