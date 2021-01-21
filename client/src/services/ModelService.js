// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { JsonldGraph } from "jsonld-graph";

import { apiService } from "./ApiService";
import context from "./ref/context";

const REL_TARGET_ANY = "*";
const getModelDisplayName = vertex => vertex.getAttributeValue("dtmi:dtdl:property:displayName;2");
const getModelDescription = vertex => vertex.getAttributeValue("dtmi:dtdl:property:description;2");
const getPropertyName = vertex => vertex.getAttributeValue("dtmi:dtdl:property:name;2");
const getPropertyWritable = vertex => vertex.getAttributeValue("http://azure.com/DigitalTwin/MetaModel/undefinedTerm/writable");

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

  if (schemaEdge.toVertex.isType("dtmi:dtdl:class:Map;2")) {
    return {
      type: "Map",
      fields: [ ...schemaEdge.toVertex.getOutgoing("dtmi:dtdl:property:fields;2")
        .map(edge => ({
          name: getPropertyName(edge.toVertex),
          schema: inferSchema(edge.toVertex)
        }))
        .filter(edge => !!edge.schema) ]
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

  async initializeWithModels(models) {
    this.modelGraph = new JsonldGraph([
      { uri: "dtmi:dtdl:context;2", context }
    ]);
    await this.modelGraph.load(models);
  }

  async getModelIdsForUpload(models) {
    await this.initializeWithModels(models);
    const sortedModels = [];
    const checkedList = [];
    const vertices = this.modelGraph.getVertices(x => x.isType("dtmi:dtdl:class:Interface;2")).items();
    for (const vertice of vertices) {
      this._addReferencedModels(vertice, sortedModels, checkedList);
    }
    return sortedModels;
  }

  async getRelationships(sourceModelId, targetModelId) {
    await this.initialize();
    const sourceModel = this._getModel(sourceModelId);
    if (targetModelId) {
      const targetModel = this._getModel(targetModelId);
      return sourceModel
        .relationships
        .filter(x => x.target === REL_TARGET_ANY || x.target === targetModelId || targetModel.bases.some(y => y === x.target))
        .map(x => x.name);
    }
    return sourceModel.relationships;
  }

  async getModelById(sourceModelId) {
    await this.initialize();
    return this._getModel(sourceModelId);
  }

  async getProperties(sourceModelId) {
    await this.initialize();
    const sourceModel = this._getModel(sourceModelId);
    return this._getChildComponentProperties(sourceModel);
  }

  async getTelemetries(sourceModelId) {
    await this.initialize();
    return this._getModel(sourceModelId).telemetries;
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
        m.getOutgoing("dtmi:dtdl:property:contents;2")
          .filter(x => x.toVertex.isType("dtmi:dtdl:class:Component;2"))
          .items()
          .map(x => x.toVertex.getOutgoing("dtmi:dtdl:property:schema;2").first())
          .filter(x => x)
          .forEach(x => referenced[x.toVertex.id] = x.toVertex);
      }

      for (const m of models.filter(x => !referenced[x.id])) {
        await apiService.deleteModel(m.id);
        models.splice(models.indexOf(m), 1);
      }
    }
  }

  async createPayload(modelId) {
    await this.initialize();
    const model = this._getModel(modelId);
    const payload = {
      $metadata: {
        $model: modelId
      }
    };
    for (const component of model.components) {
      const componentPayload = {
        $metadata: {
        }
      };
      payload[component.name] = componentPayload;
    }
    return payload;
  }

  // eslint-disable-next-line complexity
  getPropertyDefaultValue(schema, current) {
    const isCurrentUndefined = typeof current === "undefined";
    if (typeof schema === "object") {
      const schemaType = schema.type ?? schema["@type"];
      const enumValues = schema.values ?? schema.enumValues;
      switch (schemaType) {
        case "Enum":
          return enumValues.length > 0 ? enumValues[0].value ?? enumValues[0].enumValue : this.getPropertyDefaultValue(schema.valueSchema, current);
        case "Map":
        default:
          return isCurrentUndefined ? {} : current;
      }
    }

    switch (schema) {
      case "dtmi:dtdl:instance:Schema:double;2":
      case "dtmi:dtdl:instance:Schema:integer;2":
      case "dtmi:dtdl:instance:Schema:long;2":
      case "dtmi:dtdl:instance:Schema:float;2":
      case "double":
      case "integer":
      case "long":
      case "float":
        return isCurrentUndefined ? 0 : current;
      case "dtmi:dtdl:instance:Schema:string;2":
      case "string":
        return isCurrentUndefined ? " " : current.toString();
      case "dtmi:dtdl:instance:Schema:boolean;2":
      case "boolean":
        return isCurrentUndefined ? false : current;
      default:
        return isCurrentUndefined ? "" : current;
    }
  }

  _addReferencedModels(vertice, sortedModels, checkedList) {
    if (checkedList.some(id => id === vertice.id)) {
      return;
    }
    checkedList.push(vertice.id);
    vertice.getOutgoing("dtmi:dtdl:property:extends;2")
      .filter(x => x.toVertex.isType("dtmi:dtdl:class:Interface;2"))
      .items()
      .forEach(x => this._addReferencedModels(x.toVertex, sortedModels, checkedList));
    vertice.getOutgoing("dtmi:dtdl:property:contents;2")
      .filter(x => x.toVertex.isType("dtmi:dtdl:class:Component;2"))
      .items()
      .map(x => x.toVertex.getOutgoing("dtmi:dtdl:property:schema;2").first())
      .filter(x => x)
      .forEach(x => this._addReferencedModels(x.toVertex, sortedModels, checkedList));
    sortedModels.push(vertice.id);
  }

  _getModel(modelId) {
    const contents = { properties: [], relationships: [], telemetries: [], bases: [], components: [], displayName: "", description: "" };
    const model = this.modelGraph.getVertex(modelId);
    if (model) {
      this._mapModel(model, contents);
    }

    return contents;
  }

  _mapModel(vertex, contents) {
    const safeAdd = (collection, item) => Object.keys(item).every(x => item[x] !== null) && collection.push(item);

    contents.displayName = getModelDisplayName(vertex);
    contents.description = getModelDescription(vertex);

    vertex
      .getOutgoing("dtmi:dtdl:property:contents;2")
      .items()
      .forEach(x => {
        if (x.toVertex.isType("dtmi:dtdl:class:Property;2")) {
          safeAdd(contents.properties, {
            name: getPropertyName(x.toVertex),
            schema: inferSchema(x.toVertex),
            writable: getPropertyWritable(x.toVertex)
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

        if (x.toVertex.isType("dtmi:dtdl:class:Component;2")) {
          const component = this._getModel(inferSchema(x.toVertex));
          component.name = getPropertyName(x.toVertex);
          component.schema = inferSchema(x.toVertex);
          safeAdd(contents.components, component);
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

  _getChildComponentProperties(component) {
    const properties = {};
    component.properties.forEach(property => {
      properties[property.name] = {
        schema: property.schema,
        writable: property.writable ?? true
      };
    });

    component.components.forEach(c => {
      properties[c.name] = this._getChildComponentProperties(c);
    });

    return properties;
  }

}
