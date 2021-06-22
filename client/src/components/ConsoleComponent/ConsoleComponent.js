// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import Terminal from "react-console-emulator";
import { v4 as uuidv4 } from "uuid";

import { apiService } from "../../services/ApiService";
import { eventService } from "../../services/EventService";
import { ModelService } from "../../services/ModelService";
import { REL_TYPE_INCOMING } from "../../services/Constants";

import "./ConsoleComponent.scss";

export class ConsoleComponent extends Component {

  constructor(props) {
    super(props);
    this.terminal = React.createRef();
  }

  componentDidMount() {
    eventService.subscribeFocusConsole(() => {
      if (this.terminal.current) {
        this.terminal.current.focusTerminal();
      }
    });
  }

  patchTwin = async (arg1, arg2, arg3, arg4) => {
    if (arg1 && arg2 && arg3 && arg4) {
      try {
        const twin = await apiService.getTwinById(arg1);
        const properties = await new ModelService().getProperties(twin.$metadata.$model);
        const prop = properties[arg3];

        if (!prop) {
          this.pushToStdout("*** Property doesn\"t exist!");
          return;
        }

        let newArg4 = arg4;
        switch (prop.schema) {
          case "dtmi:dtdl:instance:Schema:integer;2":
            newArg4 = parseInt(arg4, 10);
            break;
          case "dtmi:dtdl:instance:Schema:double;2":
          case "dtmi:dtdl:instance:Schema:long;2":
          case "dtmi:dtdl:instance:Schema:float;2":
            newArg4 = parseFloat(arg4);
            break;
          case "dtmi:dtdl:instance:Schema:boolean;2":
            newArg4 = (arg4.toLowerCase() === "true");
            break;
          default:
            break;
        }

        const patch = { op: arg2, path: `/${arg3}`, value: newArg4 };
        const result = await apiService.updateTwin(arg1, [ patch ]);
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error patching twin: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getTwin = async arg1 => {
    if (arg1) {
      try {
        const result = await apiService.getTwinById(arg1);
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error retrieving twin from Azure Digital Twins: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  addTwin = async (arg1, arg2) => {
    if (arg1 && arg2) {
      try {
        const modelService = new ModelService();
        const payload = await modelService.createPayload(arg1);
        const result = await apiService.addTwin(arg2, payload);
        eventService.publishCreateTwin({ $dtId: arg2, $metadata: { $model: arg1 } });
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error creating twin from Azure Digital Twins: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteTwin = async arg1 => {
    if (arg1) {
      try {
        await apiService.deleteTwin(arg1);
        eventService.publishDeleteTwin(arg1);
        this.pushToStdout(`*** Deleted Twin with ID: ${arg1}`);
      } catch (exc) {
        this.pushToStdout(`*** Error deleting twin from Azure Digital Twins: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteAllTwins = async () => {
    try {
      const allTwins = await apiService.getAllTwins();
      const ids = allTwins ? allTwins.map(twin => twin.$dtId) : [];
      await apiService.deleteAllTwins(ids);
      eventService.publishClearTwinsData();
      this.pushToStdout(`*** Deleted all twins.`);
    } catch (exc) {
      this.pushToStdout(`*** Error deleting twins: ${exc}`);
    }
  }

  getRelationships = async (arg1, type) => {
    if (arg1) {
      try {
        const edgeList = await apiService.queryRelationships([ arg1 ], type);
        if (edgeList !== null) {
          if (edgeList.length <= 0) {
            this.pushToStdout(`*** No relationships found.`);
          }

          for (const edge of edgeList) {
            this.pushToStdout(JSON.stringify(edge, null, 2));
          }
        }
      } catch (exc) {
        this.pushToStdout(`*** Error getting relationships: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getIncomingRelationships = async arg1 => {
    await this.getRelationships(arg1, REL_TYPE_INCOMING);
  }

  addRelationship = async (arg1, arg2, arg3) => {
    if (arg1 && arg2 && arg3) {
      try {
        const relId = uuidv4();
        const result = await apiService.addRelationship(arg1, arg2, arg3, relId);
        eventService.publishAddRelationship({ $sourceId: arg1, $relationshipId: relId, $relationshipName: arg3, $targetId: arg2 });
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error creating relationship: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteRelationship = async (arg1, arg2) => {
    if (arg1 && arg2) {
      try {
        await apiService.deleteRelationship(arg1, arg2);
        eventService.publishDeleteRelationship({ $sourceId: arg1, $relationshipId: arg2 });
        this.pushToStdout(`*** Deleted relationship with ID: ${arg2}`);
      } catch (exc) {
        this.pushToStdout(`*** Error deleting relationship: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getModel = async arg1 => {
    if (arg1) {
      try {
        const result = await apiService.getModelById(arg1);
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error retrieving model from Azure Digital Twins: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getModels = async () => {
    try {
      const result = await apiService.queryModels();
      this.pushToStdout(JSON.stringify(result, null, 2));
    } catch (exc) {
      this.pushToStdout(`*** Error retrieving models from Azure Digital Twins: ${exc}`);
    }
  }

  addModel = async arg1 => {
    if (arg1) {
      try {
        const model = JSON.parse(arg1);
        const result = await apiService.addModels([ model ]);
        eventService.publishCreateModel();
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(
          `*** Error creating model - Ensure there are no spaces in your input. You should NOT escape your JSON string: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteModel = async arg1 => {
    if (arg1) {
      try {
        await apiService.deleteModel(arg1);
        eventService.publishDeleteModel(arg1);
        this.pushToStdout(`*** Deleted model with ID: ${arg1}`);
      } catch (exc) {
        this.pushToStdout(`*** Error deleting model: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteAllModels = async () => {
    try {
      await new ModelService().deleteAll();
      eventService.publishClearModelsData();
      this.pushToStdout(`*** All models deleted.`);
    } catch (exc) {
      this.pushToStdout(`*** Error deleting all models: ${exc}`);
    }
  }

  query = async args => {
    if (args) {
      try {
        const query = `${Array.from(args).join(" ")}`;
        const result = await apiService.queryTwins(query);
        this.pushToStdout(JSON.stringify(result, null, 2));
      } catch (exc) {
        this.pushToStdout(`*** Error retrieving data from Azure Digital Twins: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  observeProperties = async (arg1, arg2) => {
    if (arg1 && arg2) {
      try {
        const twin = await apiService.getTwinById(arg1);
        if (twin[arg2]) {
          this.pushToStdout(`*** Observed property ${arg2} for TwinId '${arg1}': ${twin[arg2]}`);
        } else {
          this.pushToStdout(`*** Property ${arg2} not found for TwinId '${arg1}'`);
        }
      } catch (exc) {
        this.pushToStdout(`*** Error observing properties: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getRelationship = async (arg1, arg2) => {
    if (arg1 && arg2) {
      try {
        const relationship = await apiService.getRelationship(arg1, arg2);
        if (relationship) {
          this.pushToStdout(`${JSON.stringify(relationship, null, 2)}`);
        } else {
          this.pushToStdout(`*** Relationship ${arg2} not found for TwinId '${arg1}'`);
        }
      } catch (exc) {
        this.pushToStdout(`*** Error getting the relationship: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  getEventRoutes = async () => {
    try {
      const eventRoutes = await apiService.getEventRoutes();
      this.pushToStdout(`${JSON.stringify(eventRoutes, null, 2)}`);
    } catch (exc) {
      this.pushToStdout(`*** Error getting the event routes: ${exc}`);
    }
  }

  getEventRoute = async arg1 => {
    if (arg1) {
      try {
        const eventRoute = await apiService.getEventRoute(arg1);
        if (eventRoute) {
          this.pushToStdout(`${JSON.stringify(eventRoute, null, 2)}`);
        } else {
          this.pushToStdout(`*** Event route with id ${arg1} not found.`);
        }
      } catch (exc) {
        this.pushToStdout(`*** Error getting the event route: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  addEventRoute = async (arg1, arg2, arg3) => {
    if (arg1 && arg2 && arg3) {
      try {
        const eventRoute = await apiService.addEventRoute(arg1, arg2, arg3);
        this.pushToStdout(`${JSON.stringify(eventRoute, null, 2)}`);
      } catch (exc) {
        this.pushToStdout(`*** Error creating the event route: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  deleteEventRoute = async arg1 => {
    if (arg1) {
      try {
        await apiService.deleteEventRoute(arg1);
        this.pushToStdout(`*** Deleted event route with ID: ${arg1}`);
      } catch (exc) {
        this.pushToStdout(`*** Error deleting the event route: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  decommissionModel = async arg1 => {
    if (arg1) {
      try {
        await apiService.decommissionModel(arg1);
        this.pushToStdout(`*** Decommission Model with ID: ${arg1}`);
      } catch (exc) {
        this.pushToStdout(`*** Error decommissioning model: ${exc}`);
      }
    } else {
      this.pushToStdout("*** Not enough params");
    }
  }

  pushToStdout = message => {
    const terminal = this.terminal ? this.terminal.current : null;
    if (terminal) {
      terminal.pushToStdout(message);
      terminal.scrollToBottom();
    }
  }

  commands = {
    patchtwin: {
      description: "patch a digital twin",
      usage: "patchtwin <twinId:string> <operation:string> <propertyName:string> <value:string>",
      fn: (arg1, arg2, arg3, arg4) => {
        this.patchTwin(arg1, arg2, arg3, arg4);
      }
    },
    gettwin: {
      description: "get a digital twin",
      usage: "gettwin <twinId:string>",
      fn: arg1 => {
        this.getTwin(arg1);
      }
    },
    addtwin: {
      description: "add a digital twin",
      usage: "addtwin <modelId:string> <newTwinId:string>",
      fn: (arg1, arg2) => {
        this.addTwin(arg1, arg2);
      }
    },
    deltwin: {
      description: "delete a digital twin",
      usage: "deltwin <twinId:string>",
      fn: arg1 => {
        this.deleteTwin(arg1);
      }
    },
    delalltwins: {
      description: "delete all digital twins",
      usage: "delalltwins",
      fn: () => {
        this.deleteAllTwins();
      }
    },
    getrelationships: {
      description: "get relationships",
      usage: "getrelationships <twinId:string>",
      fn: arg1 => {
        this.getRelationships(arg1);
      }
    },
    getrelationship: {
      description: "get a specific relationship by id",
      usage: "getRelationship <sourceTwinId:string> <relationshipId:string>",
      fn: (arg1, arg2) => {
        this.getRelationship(arg1, arg2);
      }
    },
    getincomrel: {
      description: "get incoming relationship",
      usage: "getrel <twinId:string>",
      fn: arg1 => {
        this.getIncomingRelationships(arg1);
      }
    },
    addrel: {
      description: "add relationship",
      usage: "addrel <sourceId:string> <targetId:string> <relationshipName:string>",
      fn: (arg1, arg2, arg3) => {
        this.addRelationship(arg1, arg2, arg3);
      }
    },
    delrel: {
      description: "delete relationship",
      usage: "delrel <twinId:string> <relationshipId:string>",
      fn: (arg1, arg2) => {
        this.deleteRelationship(arg1, arg2);
      }
    },
    getmodel: {
      description: "get model info",
      usage: "getmodel <modelId:string>",
      fn: arg1 => {
        this.getModel(arg1);
      }
    },
    getmodels: {
      description: "get models info",
      usage: "getmodels <modelId:string>",
      fn: arg1 => {
        this.getModels(arg1);
      }
    },
    addmodel: {
      description: "add model (ensure JSON has no spaces and is not escaped)",
      usage: "addmodel <modelJSON:string>",
      fn: arg1 => {
        this.addModel(arg1);
      }
    },
    delmodel: {
      description: "delete model",
      usage: "delmodel <modelId:string>",
      fn: arg1 => {
        this.deleteModel(arg1);
      }
    },
    delallmodels: {
      description: "deletes all models in your instance",
      usage: "delallmodels",
      fn: () => {
        this.deleteAllModels();
      }
    },
    query: {
      description: "query twins",
      usage: "query <string>",
      fn: (...args) => {
        this.query(args);
      }
    },
    observeproperties: {
      description: "observes the selected properties on the selected twins",
      usage: "observeproperties <twinId:string> <propertyName:string>",
      fn: (arg1, arg2) => {
        this.observeProperties(arg1, arg2);
      }
    },
    geteventroutes: {
      description: "get all the event routes",
      usage: "geteventroutes",
      fn: () => {
        this.getEventRoutes();
      }
    },
    geteventroute: {
      description: "get a specific route by id",
      usage: "geteventroute <routeId:string>",
      fn: arg1 => {
        this.getEventRoute(arg1);
      }
    },
    addeventroute: {
      description: "creates a new event route",
      usage: "addeventroute <routeId:string> <endpointId:string> <filter:bool>",
      fn: (arg1, arg2, arg3) => {
        this.addEventRoute(arg1, arg2, arg3);
      }
    },
    deleventroute: {
      description: "deletes an event route by the id",
      usage: "deleventroute <routeId:string>",
      fn: arg1 => {
        this.deleteEventRoute(arg1);
      }
    },
    decommissionmodel: {
      description: "decommission model",
      usage: "decommissionmodel <modelId:string>",
      fn: arg1 => {
        this.decommissionModel(arg1);
      }
    }
  }

  render() {
    return (
      <Terminal
        welcomeMessage="Azure Digital Twins Explorer command prompt"
        commands={this.commands}
        contentClassName="cc-content"
        inputClassName="cc-input"
        messageClassName="cc-message"
        promptLabel="$>"
        className="cc-console"
        ref={this.terminal} />
    );
  }

}
