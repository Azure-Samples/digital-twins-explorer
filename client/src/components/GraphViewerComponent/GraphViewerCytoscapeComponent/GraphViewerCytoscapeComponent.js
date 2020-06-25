// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import dblclick from "cytoscape-dblclick";

import { colors, graphStyles, dagreOptions, colaOptions, klayOptions, fcoseOptions } from "./config";
import { getUniqueRelationshipId } from "../../../utils/utilities";

import "./GraphViewerCytoscapeComponent.scss";

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(fcose);
cytoscape.use(dblclick);

export const GraphViewerCytoscapeLayouts = {
  "Cola": colaOptions,
  "Dagre": dagreOptions,
  "fCoSE": fcoseOptions,
  "Klay": klayOptions
};

export class GraphViewerCytoscapeComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };
    this.graphControl = null;
    this.selectedNodes = [];
    this.layout = "Klay";
  }

  addTwins(twins) {
    const mapped = twins
      .filter(x => this.graphControl.$id(x.$dtId).length === 0)
      .map(x => ({
        data: {
          id: x.$dtId,
          label: x.$dtId,
          modelId: x.$metadata.$model,
          category: "Twin"
        }
      }));

    this.graphControl.add(mapped);
  }

  removeTwins(twins) {
    twins.forEach(x => {
      const i = this.selectedNodes.findIndex(y => y.id === x);
      if (i >= 0) {
        this.selectedNodes.splice(i, 1);
      }

      this.graphControl.$id(x).remove();
    });
  }

  clearTwins() {
    this.selectedNodes = [];
    this.graphControl.elements().remove();
  }

  getTwins() {
    return this.graphControl.nodes().map(x => x.id());
  }

  addRelationships(relationships) {
    const mapped = relationships
      .map(x => ({
        data: {
          source: x.$sourceId,
          target: x.$targetId,
          label: x.$relationshipName,
          id: getUniqueRelationshipId(x)
        }
      }))
      .filter(x => this.graphControl.$id(x.id).length === 0);

    const checked = [];
    for (const rel of mapped) {
      const src = rel.data.source;
      const tar = rel.data.target;
      const el = this.graphControl.nodes(`[id="${src}"]`);
      const elt = this.graphControl.nodes(`[id="${tar}"]`);
      if (!el.empty() && !elt.empty()) {
        checked.push(rel);
      }
    }

    this.graphControl.add(checked);
  }

  getRelationships() {
    return this.graphControl.edges().map(x => x.id());
  }

  removeRelationships(relationships) {
    relationships.forEach(x => {
      this.graphControl.$id(x).remove();
    });
  }

  getColor(i) {
    const im = i % colors.length;
    return (colors[(colors.length - 1) - im]);
  }

  doLayout() {
    const cy = this.graphControl;
    cy.batch(() => {
      const types = {};
      const mtypes = {};
      const el = cy.nodes("*");

      // Color by type attribute
      for (let i = 0; i < el.length; i++) {
        types[el[i].data("type")] = `#${this.getColor(i)}`;
      }
      for (const t of Object.keys(types)) {
        cy.elements(`node[type="${t}"]`).style("background-color", types[t]);
      }

      // Color by model type
      for (let i = 0; i < el.length; i++) {
        mtypes[el[i].data("modelId")] = `#${this.getColor(i)}`;
      }
      for (const t of Object.keys(mtypes)) {
        cy.elements(`node[modelId="${t}"]`).style("background-color", mtypes[t]);
      }
    });

    return new Promise(resolve => {
      const layout = cy.layout(GraphViewerCytoscapeLayouts[this.layout]);
      layout.on("layoutstop", () => resolve());
      layout.run();
    });
  }

  setLayout(layout) {
    this.layout = layout;
  }

  onNodeSelected = e => {
    this.selectedNodes.push({ id: e.target.id(), modelId: e.target.data().modelId });
    this.onNodeClicked();
  }

  onNodeUnselected = e => {
    const removed = this.selectedNodes.findIndex(x => x.id === e.target.id());
    if (removed >= 0) {
      this.selectedNodes.splice(removed, 1);
      this.onNodeClicked();
    }
  }

  onNodeClicked = () => {
    if (this.props.onNodeClicked) {
      this.props.onNodeClicked({
        selectedNode: this.selectedNodes.length > 0 ? this.selectedNodes[this.selectedNodes.length - 1] : null,
        selectedNodes: this.selectedNodes.length > 0 ? this.selectedNodes : null
      });
    }
  }

  onNodeDoubleClicked = e => {
    if (this.props.onNodeDoubleClicked) {
      this.props.onNodeDoubleClicked({ id: e.target.id() });
    }
  }

  onControlClicked = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      this.props.onControlClicked(e);
    }
  }

  zoomToFit() {
    this.graphControl.fit();
  }

  center() {
    this.graphControl.center();
  }

  render() {
    return (
      <CytoscapeComponent elements={[]}
        className="graph-control"
        stylesheet={graphStyles}
        maxZoom={2}
        cy={cy => {
          if (this.graphControl !== cy) {
            this.graphControl = cy;
            this.graphControl.dblclick();
            this.graphControl.on("select", "node", this.onNodeSelected);
            this.graphControl.on("unselect", "node", this.onNodeUnselected);
            this.graphControl.on("click", this.onControlClicked);
            this.graphControl.on("dblclick", "node", this.onNodeDoubleClicked);
          }
        }} />
    );
  }

}
