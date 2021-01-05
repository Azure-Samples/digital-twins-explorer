// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable max-lines-per-function */

import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import dblclick from "cytoscape-dblclick";
import contextMenus from "cytoscape-context-menus";
import popper from "cytoscape-popper";

import { colors, graphStyles, dagreOptions, colaOptions, klayOptions, fcoseOptions } from "./config";
import { getUniqueRelationshipId } from "../../../utils/utilities";
import { settingsService } from "../../../services/SettingsService";

import "./GraphViewerCytoscapeComponent.scss";
import "cytoscape-context-menus/cytoscape-context-menus.css";

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(fcose);
cytoscape.use(dblclick);
cytoscape.use(contextMenus);
cytoscape.use(popper);

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
    this.contextMenuItems = [
      {
        id: "header-1",
        content: "Hide:",
        selector: "node, edge",
        disabled: true,
        onClickFunction: e => {
          e.preventDefault();
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-edge",
        content: "Hide relationship",
        selector: "edge",
        onClickFunction: this.onHideRelationship,
        hasTrailingDivider: true
      },
      {
        id: "hide-all-edges-of-type",
        content: "Hide all relationships of type",
        selector: "edge",
        onClickFunction: this.onHideRelationshipsOfType,
        hasTrailingDivider: true
      },
      {
        id: "hide-selected",
        content: "Hide selected",
        selector: "node",
        onClickFunction: e => {
          this.props.onHide();
          this.hideSelectedTwins(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-selected-with-children",
        content: "Hide selected + Children",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideWithChildren();
          this.hideWithChildren(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-others",
        content: "Hide all others",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideOthers();
          this.hideOtherTwins(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-non-children",
        content: "Hide non children",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideNonChildren();
          this.hideNonChildren(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "header-2",
        content: "Options:",
        selector: "node, edge",
        disabled: true,
        onClickFunction: e => {
          e.preventDefault();
        },
        hasTrailingDivider: true
      },
      {
        id: "delete-edge",
        content: "Delete relationship",
        selector: "edge",
        onClickFunction: e => {
          this.props.onConfirmRelationshipDelete(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "delete-twin",
        content: "Delete twin(s)",
        selector: "node",
        onClickFunction: e => {
          this.props.onConfirmTwinDelete(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "get-relationship",
        content: "Get relationships",
        selector: "node",
        onClickFunction: e => {
          this.props.onGetRelationships(e);
        },
        hasTrailingDivider: true
      },
      {
        id: "add-relationship",
        content: "Add relationships",
        selector: "node",
        show: false,
        onClickFunction: this.onAddRelationship,
        hasTrailingDivider: true
      }
    ];
  }

  componentDidMount() {
    const cy = this.graphControl;
    this.contextMenu = cy.contextMenus({
      menuItems: this.contextMenuItems,
      menuItemClasses: [ "custom-menu-item" ],
      contextMenuClasses: [ "custom-context-menu" ]
    });
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

  hideSelectedTwins = ({ target: node }) => {
    const cy = this.graphControl;
    if (this.selectedNodes.length > 0) {
      this.clearSelection();
      this.selectedNodes.forEach(x => {
        cy.$id(x.id).toggleClass("hide", true);
      });
      cy.$(":selected").unselect();
      this.selectedNodes = [];
    } else if (node && node.id()) {
      cy.$id(node.id()).toggleClass("hide", true);
    }
  }

  onAddRelationship = ({ target: node }) => {
    if (node && node.id()) {
      this.props.onCreateRelationship({ id: node.id(), modelId: node.data().modelId });
    }
  }

  hideOtherTwins = ({ target: node }) => {
    const cy = this.graphControl;
    if (this.selectedNodes.length > 0) {
      cy.nodes().forEach(currentNode => {
        if (this.selectedNodes.filter(n => n.id === currentNode.id()).length === 0 && currentNode.id() !== node.id()) {
          cy.$id(currentNode.id()).toggleClass("hide", true);
        }
      });
    } else if (node && node.id()) {
      cy.nodes().forEach(currentNode => {
        if (currentNode.id() !== node.id()) {
          cy.$id(currentNode.id()).toggleClass("hide", true);
        }
      });
    }
  }

  hideNonChildren = ({ target: node }) => {
    const cy = this.graphControl;
    let relatedNodesIds = [];
    if (this.selectedNodes.length > 0) {
      relatedNodesIds = this.getSelectedNodesChildrenIds([ ...this.selectedNodes, { id: node.id(), modelId: node.data().modelId } ]);
    } else if (node && node.id()) {
      relatedNodesIds = this.getSelectedNodesChildrenIds([ { id: node.id(), modelId: node.data().modelId } ]);
    }
    cy.nodes().forEach(cyNode => {
      if (relatedNodesIds.indexOf(cyNode.id()) === -1) {
        cy.$id(cyNode.id()).toggleClass("hide", true);
      }
    });
  }

  getSelectedNodesChildrenIds = nodes => {
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
    searchForChildren(nodes ? nodes.map(n => n.id) : this.selectedNodes.map(n => n.id));
    return relatedNodesIds;
  }

  hideWithChildren = ({ target: node }) => {
    const cy = this.graphControl;
    let relatedNodesIds = [];
    if (this.selectedNodes.length > 0) {
      this.clearSelection();
      cy.$(":selected").unselect();
      relatedNodesIds = this.getSelectedNodesChildrenIds([ ...this.selectedNodes, { id: node.id(), modelId: node.data().modelId } ]);
    } else if (node && node.id()) {
      relatedNodesIds = this.getSelectedNodesChildrenIds([ { id: node.id(), modelId: node.data().modelId } ]);
    }
    cy.nodes().forEach(cyNode => {
      if (relatedNodesIds.indexOf(cyNode.id()) !== -1) {
        cy.$id(cyNode.id()).toggleClass("hide", true);
      }
    });
    this.selectedNodes = [];
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

  onHideRelationship = e => {
    const target = e.target || e.cyTarget;
    target.toggleClass("hide", true);
    this.props.onHideRelationship();
  }

  onHideRelationshipsOfType = e => {
    const cy = this.graphControl;
    const target = e.target || e.cyTarget;
    const label = target.data("label");
    cy.elements(`edge[label="${label}"]`).toggleClass("hide", true);
    this.props.onHideRelationship();
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
    this.selectedNodes = [];
  }

  unselectSelectedNodes = () => {
    if (this.graphControl.$(":selected").length > 0) {
      this.graphControl.$(":selected").unselect();
      this.selectedNodes = [];
    }
  }

  unselectSelectedNodes = () => {
    if (this.graphControl.$(":selected").length > 0) {
      this.graphControl.$(":selected").unselect();
      this.selectedNodes = [];
    }
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

  showAllEdges = () => {
    const cy = this.graphControl;
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

  onNodeRightClick = ({ target: node }) => {
    if (this.selectedNodes.length === 1 && this.selectedNodes[0].id !== node.id()) {
      this.contextMenu.showMenuItem("add-relationship");
    } else if (this.selectedNodes.length === 2 && this.selectedNodes.filter(n => n.id === node.id()).length === 1) {
      this.contextMenu.showMenuItem("add-relationship");
    } else {
      this.contextMenu.hideMenuItem("add-relationship");
    }
  }

  getContents = (properties, relationships) => {
    let definedProperties = "";
    let definedRelationships = "";
    for (const [ key ] of Object.entries(properties)) {
      definedProperties += `<li>${key}</li>`;
    }
    relationships.forEach(r => definedRelationships += `<li>${r.name}</li>`);
    return { definedRelationships, definedProperties };
  }

  getPopperContent = (label, modelId, modelDisplayName, modelDescription, properties, relationships) => {
    const { definedProperties, definedRelationships } = this.getContents(properties, relationships);
    const div = document.createElement("div");
    div.setAttribute("id", "cy-popper");
    div.innerHTML = `
      <div>
        <h4>DTID:</h4>
        <p>${label}</p>
        <h4>MODEL DISPLAY NAME:</h4>
        <p>${modelDisplayName}</p>
        <h4>MODEL ID:</h4>
        <p>${modelId}</p>
        <h4>DESCRIPTION:</h4>
        <p>${modelDescription ? modelDescription : ""}</p>
      </div>
      <div>
        <h4>DEFINED RELATIONSHIPS</h4>
        <ul>${definedRelationships}</ul>
      </div>
      <div>
        <h4>DEFINED PROPERTIES</h4>
        <ul>${definedProperties}</ul>
      </div>
    `;
    return div;
  };

  onNodeHover = async ({ target: node }) => {
    this.onNodeUnhover();
    const { category, label, modelId } = node.data();
    if (category === "Twin") {
      const { displayName, description, properties, relationships } = await this.props.onNodeMouseEnter(modelId);
      node.popper({
        content: () => {
          const contentDiv = this.getPopperContent(label, modelId, displayName, description, properties, relationships);
          document.body.appendChild(contentDiv);
          return contentDiv;
        },
        popper: {}
      });
    }
  }

  onNodeUnhover = () => {
    const activePopper = document.querySelector("#cy-popper");
    if (activePopper) {
      activePopper.parentNode.removeChild(activePopper);
    }
  }

  onControlClicked = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      this.props.onControlClicked(e);
      this.clearSelection();
      this.contextMenu.hideMenuItem("add-relationship");
      this.unselectSelectedNodes();
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
            this.graphControl.on("mouseover", this.onNodeHover);
            this.graphControl.on("select", "node", this.onNodeSelected);
            this.graphControl.on("unselect", "node", this.onNodeUnselected);
            this.graphControl.on("select", "edge", this.onEdgeSelected);
            this.graphControl.on("click", this.onControlClicked);
            this.graphControl.on("dblclick", "node", this.onNodeDoubleClicked);
            this.graphControl.on("cxttap", "node", this.onNodeRightClick);
          }
        }} />
    );
  }

}