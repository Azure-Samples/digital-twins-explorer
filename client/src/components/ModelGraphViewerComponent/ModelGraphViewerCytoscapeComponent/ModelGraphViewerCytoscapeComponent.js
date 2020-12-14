// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

import { graphStyles, modelWithImageStyle } from "./config";
import { colors, dagreOptions, colaOptions, klayOptions, fcoseOptions, d3ForceOptions } from "../../../config/CytoscapeConfig";
import { settingsService } from "../../../services/SettingsService";

import "./ModelGraphViewerCytoscapeComponent.scss";

export const ModelGraphViewerCytoscapeLayouts = {
  "Cola": { ...colaOptions, nodeSpacing: () => 40 },
  "Dagre": dagreOptions,
  "fCoSE": fcoseOptions,
  "Klay": klayOptions,
  "d3Force": d3ForceOptions
};

export class ModelGraphViewerCytoscapeComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };
    this.graphControl = null;
    this.selectedNodes = [];
    this.layout = "d3Force";
  }

  addNodes(nodes) {
    const mapped = nodes
      .filter(x => this.graphControl.$id(x.id).length === 0)
      .map(x => ({
        data: {
          id: x.id,
          label: x.label,
          category: "Model"
        }
      }));

    this.graphControl.add(mapped);
  }

  removeNodes(nodes) {
    if (nodes) {
      nodes.forEach(x => {
        const i = this.selectedNodes.findIndex(y => y.id === x);
        if (i >= 0) {
          this.selectedNodes.splice(i, 1);
        }

        this.graphControl.$id(x).remove();
      });
    }
  }

  hideSelectedNodes() {
    this.selectedNodes.forEach(x => {
      this.graphControl.$id(x.id).toggleClass("hide");
    });
  }

  clearNodes() {
    this.selectedNodes = [];
    this.graphControl.elements().remove();
  }

  getNodes() {
    return this.graphControl.nodes().map(x => x.id());
  }

  addRelationships(relationships, relationshipClassName = "") {
    const mapped = relationships
      .map(x => ({
        data: {
          source: x.sourceId,
          target: x.targetId,
          label: x.relationshipName,
          id: `${x.sourceId}_${x.relationshipName}`
        },
        classes: relationshipClassName
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

  doLayout() {
    const cy = this.graphControl;

    cy.batch(() => {
      const el = cy.nodes("*");

      // Add model images
      for (let i = 0; i < el.length; i++) {
        const modelId = el[i].data("id");
        const backgroundImage = this.getBackgroundImage(modelId);
        if (backgroundImage) {
          cy.elements(`node[id="${modelId}"]`).style({
            "background-image": `url(${this.getBackgroundImage(modelId)})`,
            ...modelWithImageStyle
          });
        }
      }
    });

    return new Promise(resolve => {
      const layout = cy.layout(ModelGraphViewerCytoscapeLayouts[this.layout]);
      layout.on("layoutstop", () => resolve());
      layout.run();
    });
  }

  setLayout(layout) {
    this.layout = layout;
  }

  updateModelIcon(modelId) {
    const cy = this.graphControl;
    cy.elements(`node[id="${modelId}"]`).style({
      "background-image": `url(${this.getBackgroundImage(modelId)})`,
      ...modelWithImageStyle
    });
  }

  onNodeSelected = ({ target: node }) => {
    this.selectedNodes.push({ id: node.id() });
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

  onEdgeSelected = e => {
    if (this.props.onEdgeClicked) {
      this.props.onEdgeClicked(e.target.data());
    }
  }

  onControlClicked = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      const cy = this.graphControl;
      cy.nodes().forEach(node => cy.$id(node.id()).toggleClass("opaque", false));
      this.props.onControlClicked(e);
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

  hideRelationships = () => this.graphControl.$("edge.related").toggleClass("hide", true);

  showRelationships = () => this.graphControl.$("edge.related").toggleClass("hide", false);

  hideInheritances = () => this.graphControl.$("edge.extends").toggleClass("hide", true);

  showInheritances = () => this.graphControl.$("edge.extends").toggleClass("hide", false);

  hideComponents = () => this.graphControl.$("edge.component").toggleClass("hide", true);

  showComponents = () => this.graphControl.$("edge.component").toggleClass("hide", false);

  zoomToFit() {
    this.graphControl.fit();
  }

  center() {
    this.graphControl.center();
  }

  zoomIn() {
    let zoomLevel = this.graphControl.zoom();
    zoomLevel += 0.5;
    this.graphControl.zoom(zoomLevel);
  }

  zoomOut() {
    let zoomLevel = this.graphControl.zoom();
    if (zoomLevel > 0.5) {
      zoomLevel -= 0.5;
      this.graphControl.zoom(zoomLevel);
    }
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
