// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { JsonldGraph } from "jsonld-graph";

import { apiService } from "./ApiService";
import context from "./ref/context";

const REL_TARGET_ANY = "*";
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
    const properties = [];
    this.getChildComponentProperties(sourceModel, "", properties, false);
    return properties;
  }

  getChildComponentProperties(component, basePropertyName, properties, fromChild) {
    const baseName = basePropertyName ? `${basePropertyName}-` : "";
    component.properties.forEach(componentProperty => {
      properties.push({
        name: `${baseName}${componentProperty.name}`,
        schema: componentProperty.schema,
        writable: componentProperty.writable ?? true,
        fromChild
      });
    });
    component.components.forEach(c => {
      this.getChildComponentProperties(c, `${baseName}${c.name}`, properties, true);
    });
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
    const model = await apiService.getModelById(modelId);
    const payload = {
      $metadata: {
        $model: model.model["@id"]
      }
    };
    if (model.model.contents) {
      const components = model.model.contents.filter(content => content["@type"] === "Component");
      for (const component of components) {
        const componentModel = await apiService.getModelById(component.schema);
        const componentPayload = {
          $metadata: {
          }
        };
        const properties = componentModel.model.contents.filter(content => content["@type"] === "Property");
        properties.forEach(property => {
          componentPayload[property.name] = this.getPropertyDefaultValue(property.schema);
        });
        payload[component.name] = componentPayload;
      }
    }
    return payload;
  }

  getPropertyDefaultValue(schema) {
    if (typeof schema === "object") {
      const schemaType = schema.type ?? schema["@type"];
      const enumValues = schema.values ?? schema.enumValues;
      switch (schemaType) {
        case "Enum":
          return enumValues.length > 0 ? enumValues[0].value ?? enumValues[0].enumValue : this.getPropertyDefaultValue(schema.valueSchema);
        case "Map":
        default:
          return {};
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
        return 0;
      case "dtmi:dtdl:instance:Schema:string;2":
      case "string":
        return " ";
      case "dtmi:dtdl:instance:Schema:boolean;2":
      case "boolean":
        return false;
      default:
        return "";
    }
  }

  _getModel(modelId) {
    const contents = { properties: [], relationships: [], telemetries: [], bases: [], components: [] };
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

}
