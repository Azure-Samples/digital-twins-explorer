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
import { settingsService } from "../../../services/SettingsService";

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
    if (twins) {
      twins.forEach(x => {
        const i = this.selectedNodes.findIndex(y => y.id === x);
        if (i >= 0) {
          this.selectedNodes.splice(i, 1);
        }

        this.graphControl.$id(x).remove();
      });
    }
  }

  hideSelectedTwins() {
    this.clearSelection();
    const cy = this.graphControl;
    this.selectedNodes.forEach(x => {
      cy.$id(x.id).toggleClass("hide", true);
    });
    cy.$(":selected").unselect();
    this.selectedNodes = [];
  }

  hideOtherTwins() {
    this.clearSelection();
    const cy = this.graphControl;
    cy.nodes().forEach(node => {
      if (this.selectedNodes.filter(n => n.id === node.id()).length === 0) {
        cy.$id(node.id()).toggleClass("hide", true);
      }
    });
  }

  hideNonChildren() {
    this.clearSelection();
    const cy = this.graphControl;
    const relatedNodesIds = this.getSelectedNodesChildrenIds();
    cy.nodes().forEach(cyNode => {
      if (relatedNodesIds.indexOf(cyNode.id()) === -1) {
        cy.$id(cyNode.id()).toggleClass("hide", true);
      }
    });
  }

  getSelectedNodesChildrenIds() {
    const cy = this.graphControl;
    const relatedNodesIds = [];
    const searchForChildren = nodeIds => {
      nodeIds.forEach(nodeId => {
        const selectedNode = cy.nodes().filter(n => n.id() === nodeId);
        const connectedEdges = selectedNode.connectedEdges();
        const selectedNodeRelatedNodesIds
          = connectedEdges.filter(edge => selectedNode.id() === edge.data().source).map(edge => edge.data().target);
        relatedNodesIds.push(selectedNode.id());
        searchForChildren(selectedNodeRelatedNodesIds);
      });
    };
    searchForChildren(this.selectedNodes.map(n => n.id));
    return relatedNodesIds;
  }

  hideWithChildren() {
    this.clearSelection();
    const cy = this.graphControl;
    const relatedNodesIds = this.getSelectedNodesChildrenIds();
    cy.nodes().forEach(cyNode => {
      if (relatedNodesIds.indexOf(cyNode.id()) !== -1) {
        cy.$id(cyNode.id()).toggleClass("hide", true);
        cy.$id(cyNode.id()).unselect();
      }
    });
    cy.$(":selected").unselect();
    this.selectedNode = [];
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

  getBackgroundImage(modelId) {
    return settingsService.getModelImage(modelId);
  }

  clearSelection = () => {
    const cy = this.graphControl;
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("opaque", false);
      cy.$id(cyNode.id()).toggleClass("highlight", false);
    });
    cy.edges().forEach(cyEdge => {
      cy.$id(cyEdge.id()).toggleClass("opaque", false);
      cy.$id(cyEdge.id()).toggleClass("highlight", false);
    });
  }

  showAllNodes = () => {
    const cy = this.graphControl;
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("hide", false);
    });
    cy.edges().forEach(cyEdge => {
      cy.$id(cyEdge.id()).toggleClass("hide", false);
    });
  }

  doLayout() {
    const cy = this.graphControl;
    cy.batch(() => {
      const types = {};
      const mtypes = {};
      const rtypes = {};
      const el = cy.nodes("*");
      const rels = cy.edges("*");

      // Color by type attribute
      for (let i = 0; i < el.length; i++) {
        types[el[i].data("type")] = `#${this.getColor(i)}`;
      }
      for (const t of Object.keys(types)) {
        cy.elements(`node[type="${t}"]`).style("background-color", types[t]);
      }

      // Color by model type
      for (let i = 0; i < el.length; i++) {
        mtypes[el[i].data("modelId")] = {
          backgroundColor: `#${this.getColor(i)}`,
          backgroundImage: this.getBackgroundImage(el[i].data("modelId"))
        };
      }
      for (const t of Object.keys(mtypes)) {
        const { backgroundColor, backgroundImage } = mtypes[t];
        cy.elements(`node[modelId="${t}"]`).style({
          "background-color": backgroundColor,
          "background-image": `url(${backgroundImage})`,
          "background-fit": "cover",
          "background-clip": "node"
        });
      }

      // Color relationships by label
      for (let i = 0; i < rels.length; i++) {
        rtypes[rels[i].data("label")] = `#${this.getColor(i)}`;
      }
      for (const r of Object.keys(rtypes)) {
        cy.elements(`edge[label="${r}"]`).style("line-color", rtypes[r]);
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

  updateModelIcon(modelId) {
    const cy = this.graphControl;
    cy.elements(`node[modelId="${modelId}"]`).style({
      "background-image": `url(${this.getBackgroundImage(modelId)})`
    });
  }

  onNodeSelected = ({ target: node }) => {
    this.selectedNodes.push({ id: node.id(), modelId: node.data().modelId });
    this.highlightRelatedNodes();
    this.onNodeClicked();
  }

  onNodeUnselected = e => {
    const removed = this.selectedNodes.findIndex(x => x.id === e.target.id());
    if (removed >= 0) {
      this.selectedNodes.splice(removed, 1);
      this.highlightRelatedNodes();
      this.onNodeClicked();
    }
    if (this.selectedNodes.length === 0) {
      this.clearSelection();
    }
  }

  onEdgeSelected = e => {
    this.props.onEdgeClicked(e.target.data());
  }

  onNodeClicked = async () => {
    const { onNodeClicked } = this.props;
    if (onNodeClicked) {
      await onNodeClicked({
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
      this.clearSelection();
    }
  }

  highlightRelatedNodes() {
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      cy.edges().toggleClass("opaque", true);
      let relatedNodesIds = [];
      this.selectedNodes.forEach(selectedNodeItem => {
        const selectedNode = cy.nodes().filter(n => n.id() === selectedNodeItem.id);
        const connectedEdges = selectedNode.connectedEdges();
        connectedEdges.forEach(edge => {
          cy.$id(edge.data().id).toggleClass("highlighted", true);
          cy.$id(edge.data().id).toggleClass("opaque", false);
        });
        const selectedNodeRelatedNodesIds = connectedEdges.map(edge =>
          selectedNode.id() === edge.data().source ? edge.data().target : edge.data().source);
        relatedNodesIds = relatedNodesIds.concat(selectedNodeRelatedNodesIds);
        relatedNodesIds.push(selectedNode.id());
      });
      cy.nodes().forEach(cyNode => {
        if (relatedNodesIds.indexOf(cyNode.id()) === -1) {
          cy.$id(cyNode.id()).toggleClass("opaque", true);
        } else {
          cy.$id(cyNode.id()).toggleClass("opaque", false);
        }
      });
    } else {
      cy.nodes().forEach(cyNode => {
        cy.$id(cyNode.id()).toggleClass("opaque", false);
      });
      cy.edges().toggleClass("opaque", false);
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
            this.graphControl.on("select", "edge", this.onEdgeSelected);
            this.graphControl.on("click", this.onControlClicked);
            this.graphControl.on("dblclick", "node", this.onNodeDoubleClicked);
          }
        }} />
    );
  }

}