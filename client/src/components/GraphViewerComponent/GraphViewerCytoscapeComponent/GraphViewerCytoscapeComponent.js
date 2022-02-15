// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable max-lines-per-function */

import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import _uniqueId from "lodash/uniqueId";

import { colors, graphStyles, dagreOptions, colaOptions, klayOptions, fcoseOptions, modelWithImageStyle, navigationOptions } from "./config";
import { getUniqueRelationshipId, addNavigator } from "../../../utils/utilities";
import { settingsService } from "../../../services/SettingsService";

import "./GraphViewerCytoscapeComponent.scss";
import "cytoscape-context-menus/cytoscape-context-menus.css";

export const GraphViewerCytoscapeLayouts = {
  "Cola": colaOptions,
  "Dagre": dagreOptions,
  "fCoSE": fcoseOptions,
  "Klay": klayOptions
};
const SPACE_KEY_CODE = 32;
const ENTER_KEY_CODE = 13;
const ESC_KEY_CODE = 27;
const TAB_KEY_CODE = 9;

export class GraphViewerCytoscapeComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hideContextMenu: false
    };
    this.graphControl = null;
    this.navControlId = _uniqueId("graph-viewer-nav");
    this.selectedNodes = [];
    this.selectedOutsideComponent = [];
    this.layout = "Klay";
    this.isSelectingOnOverlay = false;
    this.isFetchingTwinData = false;
    this.canRenderPopper = false;
    this.contextMenuIsOpen = false;
    this.contextNode = null;
    this.contextEdge = null;
    this.contextMenuItems = [
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
          if (e) {
            const { target: node } = e;
            this.hideSelectedTwins(node.id());
          } else if (this.contextNode) {
            this.hideSelectedTwins(this.contextNode);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-selected-with-children",
        content: "Hide selected + children",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideWithChildren();
          if (e) {
            const { target: node } = e;
            this.hideWithChildren(node);
          } else if (this.contextNode) {
            const node = this.graphControl.$id(this.contextNode);
            this.hideWithChildren(node);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-others",
        content: "Hide all others",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideOthers();
          if (e) {
            const { target: node } = e;
            this.hideOtherTwins(node.id());
          } else if (this.contextNode) {
            this.hideOtherTwins(this.contextNode);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "hide-non-children",
        content: "Hide non-children",
        selector: "node",
        onClickFunction: e => {
          this.props.onHideNonChildren();
          if (e) {
            const { target: node } = e;
            this.hideNonChildren(node);
          } else if (this.contextNode) {
            const node = this.graphControl.$id(this.contextNode);
            this.hideNonChildren(node);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "delete-edge",
        content: "Delete relationship(s)",
        selector: "edge",
        onClickFunction: e => {
          if (e) {
            const { target: edge } = e;
            this.props.onConfirmRelationshipDelete(edge);
          } else if (this.contextNode) {
            const edge = this.graphControl.$id(this.contextEdge);
            this.props.onConfirmRelationshipDelete(edge);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "delete-twin",
        content: "Delete twin(s)",
        selector: "node",
        onClickFunction: e => {
          if (e) {
            const { target: node } = e;
            this.props.onConfirmTwinDelete(node);
          } else if (this.contextNode) {
            const node = this.graphControl.$id(this.contextNode);
            this.props.onConfirmTwinDelete(node);
          }
        },
        hasTrailingDivider: true
      },
      {
        id: "get-relationship",
        content: "Get relationships",
        selector: "node",
        onClickFunction: e => {
          if (e) {
            const { target: node } = e;
            this.props.onGetRelationships(node);
          } else if (this.contextNode) {
            const node = this.graphControl.$id(this.contextNode);
            this.props.onGetRelationships(node);
          }
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
    if (!this.props.readOnly) {
      const cy = this.graphControl;
      this.contextMenu = cy.contextMenus({
        menuItems: this.contextMenuItems,
        menuItemClasses: [ "custom-menu-item" ],
        contextMenuClasses: [ "custom-context-menu" ]
      });
    }

    const handleKeyDown = e => {
      if (e.keyCode === ESC_KEY_CODE) {
        const contextMenu = document.getElementsByClassName("custom-context-menu")[0];
        if (contextMenu.style.display === "block") {
          contextMenu.style.display = "none";
        }
      }

      if (e.keyCode === TAB_KEY_CODE) {
        const contextMenu = document.getElementsByClassName("custom-context-menu")[0];

        const menuItems = Array.from(contextMenu.children);
        const activeMenuItems = menuItems.filter(item => item.style.display !== "none");

        if (activeMenuItems && document.activeElement === activeMenuItems[activeMenuItems.length - 1]) {
          activeMenuItems[0].focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", e => {
      handleKeyDown(e);
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.displayNameProperty !== this.props.displayNameProperty) {
      if (this.graphControl) {
        let isDisplayNameAsteriskPresent = false;
        this.graphControl.nodes().forEach(twin => {
          const label = twin.data().properties?.[this.props.displayNameProperty];
          if (!label) {
            isDisplayNameAsteriskPresent = true;
          }
          twin.data("label", label ?? `*${twin.data().id}`);
        });
        this.props.setIsDisplayNameAsteriskPresent?.(isDisplayNameAsteriskPresent);
      }
    }
  }

  getLabel(twin) {
    return twin[this.props.displayNameProperty] ?? `*${twin.$dtId}`;
  }

  addTwins(twins) {
    let isDisplayNameAsteriskPresent = false;
    const mapped = twins
      .filter(twin => this.graphControl.$id(twin.$dtId).length === 0)
      .map(twin => {
        const label = this.getLabel(twin);
        if (!label) {
          isDisplayNameAsteriskPresent = true;
        }
        return ({
          data: {
            id: twin.$dtId,
            label: this.getLabel(twin),
            properties: twin,
            modelId: twin.$metadata.$model,
            category: "Twin"
          }
        });
      });

    this.props.setIsDisplayNameAsteriskPresent?.(isDisplayNameAsteriskPresent);
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

  hideSelectedTwins = nodeId => {
    const cy = this.graphControl;
    if (this.selectedNodes.length > 0) {
      this.selectedNodes.forEach(x => {
        cy.$id(x.id).toggleClass("hide", true);
      });
      cy.$(":selected").unselect();
      this.clearSelection();
    } else if (nodeId) {
      cy.$id(nodeId).toggleClass("hide", true);
    }
  }

  onAddRelationship = ({ target: node }) => {
    if (node && node.id()) {
      this.props.onCreateRelationship({ id: node.id(), modelId: node.data().modelId });
    }
  }

  hideOtherTwins = nodeId => {
    const cy = this.graphControl;
    if (this.selectedNodes.length > 0) {
      cy.nodes().forEach(currentNode => {
        if (this.selectedNodes.filter(n => n.id === currentNode.id()).length === 0 && currentNode.id() !== nodeId) {
          cy.$id(currentNode.id()).toggleClass("hide", true);
        }
      });
    } else if (nodeId) {
      cy.nodes().forEach(currentNode => {
        if (currentNode.id() !== nodeId) {
          cy.$id(currentNode.id()).toggleClass("hide", true);
        }
      });
    }
  }

  hideNonChildren = node => {
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

  hideWithChildren = node => {
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
        cyNode.toggleClass("hide", true);
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
          id: getUniqueRelationshipId(x),
          relationshipId: x.$relationshipId
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
    this.updateNodeColors();
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

  clearOverlay = () => {
    this.clearSelection();
    this.unselectSelectedNodes();
  }

  clearSelection = () => {
    const cy = this.graphControl;
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("opaque", false);
      cy.$id(cyNode.id()).toggleClass("highlighted", false);
      cy.$id(cyNode.id()).toggleClass("selected", false);
    });
    cy.edges().forEach(cyEdge => {
      cy.$id(cyEdge.id()).toggleClass("opaque", false);
      cy.$id(cyEdge.id()).toggleClass("highlighted", false);
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
    this.selectedNodes = [];
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

  updateNodeColors() {
    const cy = this.graphControl;
    const modelColors = settingsService.getModelColors();
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
        const modelId = el[i].data("modelId");
        mtypes[modelId] = {
          backgroundColor: modelColors[modelId],
          backgroundImage: this.getBackgroundImage(modelId)
        };
      }
      for (const t of Object.keys(mtypes)) {
        const { backgroundColor, backgroundImage } = mtypes[t];
        if (backgroundImage) {
          cy.elements(`node[modelId="${t}"]`).style({
            "background-color": backgroundColor,
            "background-image": `url(${backgroundImage})`,
            ...modelWithImageStyle
          });
        } else {
          cy.elements(`node[modelId="${t}"]`).style({
            "background-color": backgroundColor,
            ...modelWithImageStyle
          });
        }
      }
      // Color relationships by label
      for (let i = 0; i < rels.length; i++) {
        if (!rtypes[rels[i].data("label")]) {
          rtypes[rels[i].data("label")] = `#${this.getColor(i)}`;
        }
      }
      for (const r of Object.keys(rtypes)) {
        cy.elements(`edge[label="${r}"]`).style("line-color", rtypes[r]);
      }
    });
  }

  doLayout() {
    this.updateNodeColors();
    const cy = this.graphControl;
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
    const backgroundImage = this.getBackgroundImage(modelId);
    if (backgroundImage) {
      cy.elements(`node[modelId="${modelId}"]`).style({
        "background-image": `url(${backgroundImage})`,
        ...modelWithImageStyle
      });
    } else {
      cy.elements(`node[modelId="${modelId}"]`).style({
        ...modelWithImageStyle
      });
    }
  }

  onNodeSelected = ({ target: node }) => {
    if (this.props.overlayResults && !this.isSelectingOnOverlay) {
      this.isSelectingOnOverlay = true;
    }
    if (this.selectedOutsideComponent.length > 0) {
      const selectedOutsideIds = this.selectedOutsideComponent.map(n => n.id);
      this.selectedNodes = this.selectedNodes.filter(n => !selectedOutsideIds.includes(n.id));
      this.clearHighlighting();
    }
    this.selectedNodes.push({ id: node.id(), modelId: node.data().modelId });
    this.highlightRelatedNodes();
    this.onNodeClicked();
    this.contextMenuIsOpen = false;
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

  dimGraphElements = () => {
    const cy = this.graphControl;
    cy.edges().toggleClass("opaque", true);
    cy.edges().toggleClass("highlighted", false);
    cy.nodes().forEach(node => cy.$id(node.id()).toggleClass("opaque", true));
    cy.nodes().forEach(node => cy.$id(node.id()).toggleClass("highlight", false));
  }

  selectNodes = (nodeIds, exterior = false) => {
    this.dimGraphElements();
    if (nodeIds && nodeIds.length > 0) {
      const cy = this.graphControl;
      this.selectedNodes = [];
      if (exterior) {
        this.selectedOutsideComponent = [];
      }
      nodeIds.forEach(id => {
        const node = cy.elements(`node[id="${id}"]`);
        if (node) {
          this.selectedNodes.push({ id: node.id(), modelId: node.data().modelId });
          if (exterior) {
            this.selectedOutsideComponent.push({ id: node.id(), modelId: node.data().modelId });
          }
          cy.$id(node.data().id).toggleClass("selected", true);
          cy.$id(node.data().id).toggleClass("opaque", false);
          node.connectedEdges().forEach(edge => {
            const relatedNodeId = node.id() === edge.data().source ? edge.data().target : edge.data().source;
            if (nodeIds.indexOf(relatedNodeId) !== -1) {
              cy.$id(edge.data().id).toggleClass("highlighted", true);
              cy.$id(edge.data().id).toggleClass("opaque", false);
            }
          });
        }
      });
    } else {
      this.clearSelection();
    }
  }

  selectEdges = rels => {
    if (rels && rels.length > 0) {
      const cy = this.graphControl;
      rels.forEach(rel => {
        cy.$id(getUniqueRelationshipId(rel)).toggleClass("highlighted", true);
        cy.$id(getUniqueRelationshipId(rel)).toggleClass("opaque", false);
      });
    }
  }

  onEdgeSelected = e => {
    const { onEdgeClicked } = this.props;
    if (onEdgeClicked) {
      const cy = this.graphControl;
      const selectedEdges = cy.edges().filter(edge => edge.selected());
      onEdgeClicked(e.target.data(), selectedEdges);
    }
    this.contextMenuIsOpen = false;
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
    const { onNodeDoubleClicked } = this.props;
    if (onNodeDoubleClicked) {
      onNodeDoubleClicked({ id: e.target.id() });
    }
  }

  onNodeRightClick = ({ target: node }) => {
    this.setContextMenuState(node.id());
  }

  setContextMenuState = nodeId => {
    this.setState({ hideContextMenu: false }, () => {
      this.contextMenuIsOpen = true;
      this.onNodeUnhover();
      if (nodeId) {
        if (this.selectedNodes.length === 1 && this.selectedNodes[0].id !== nodeId) {
          this.contextMenu.showMenuItem("add-relationship");
        } else if (this.selectedNodes.length === 2 && this.selectedNodes.filter(n => n.id === nodeId).length === 1) {
          this.contextMenu.showMenuItem("add-relationship");
        } else {
          this.contextMenu.hideMenuItem("add-relationship");
        }
      }
    });
  }

  focusContextMenu = () => {
    const contextMenuEl = document.getElementsByClassName("custom-context-menu")[0];
    const availableMenuItems = Array.from(contextMenuEl.querySelectorAll(".custom-menu-item")).filter(item => !item.disabled && item.style.display !== "none");
    const focusBackAndClearHandlers = () => {
      this.props.onFocusBackToTwinViewer();
      availableMenuItems.forEach(item => {
        item.removeEventListener("keydown", handler);
      });
      this.contextNode = null;
      this.contextEdge = null;
      this.contextMenu = this.graphControl.contextMenus({
        menuItems: this.contextMenuItems,
        menuItemClasses: [ "custom-menu-item" ],
        contextMenuClasses: [ "custom-context-menu" ]
      });
    };
    const handler = e => {
      if (e.keyCode === SPACE_KEY_CODE) {
        e.preventDefault();
        focusBackAndClearHandlers();
      } else if (e.keyCode === ENTER_KEY_CODE) {
        e.preventDefault();
        e.target.click();
        focusBackAndClearHandlers();
      }
    };
    if (availableMenuItems[0]) {
      availableMenuItems[0].focus();
      availableMenuItems.forEach(item => {
        item.addEventListener("keydown", handler);
      });
    }
    availableMenuItems[availableMenuItems.length - 1].addEventListener("keydown", e => {
      e.preventDefault();
      availableMenuItems[0].focus();
    });
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
    div.addEventListener("mouseenter", () => {
      this.canRenderPopper = true;
    });
    div.addEventListener("mouseleave", () => {
      this.canRenderPopper = false;
      this.removePopper();
    });
    div.innerHTML = `
      <div>
        <h4>DTID:</h4>
        <p>${label}</p>
        ${
          modelDisplayName
            ? `<h4>MODEL DISPLAY NAME:</h4>
          <p>${modelDisplayName}</p>`
            : ""
        }
        <h4>MODEL ID:</h4>
        <p>${modelId}</p>
        ${
          modelDescription
            ? `<h4>DESCRIPTION:</h4>
          <p class="description-container">${modelDescription ? modelDescription : ""}</p>`
            : ""
        }
      </div>
      ${
        definedProperties
          ? `<div>
          <h4>DEFINED PROPERTIES</h4>
          <ul>${definedProperties}</ul>
        </div>`
          : ""
      }
      ${
        definedRelationships
          ? `<div>
          <h4>DEFINED RELATIONSHIPS</h4>
          <ul>${definedRelationships}</ul>
        </div>`
          : ""
      }
    `;
    return div;
  };

  onNodeHover = ({ target: node }) => {
    this.removePopper();
    const { category, label, modelId, properties: nodeProperties } = node.data();
    if (node !== this.graphControl && category === "Twin" && !this.isFetchingTwinData && !this.contextMenuIsOpen) {
      this.canRenderPopper = true;
      this.hoverTimeout = setTimeout(async () => {
        this.isFetchingTwinData = true;
        const twinData = await this.props.onNodeMouseEnter(modelId);
        if (twinData) {
          const { displayName, description, properties, relationships } = twinData;
          if (this.canRenderPopper) {
            node.popper({
              content: () => {
                const contentDiv = this.getPopperContent(nodeProperties?.$dtId || label, modelId, displayName, description, properties, relationships);
                document.body.appendChild(contentDiv);
                return contentDiv;
              },
              popper: {}
            });
          }
        }
        this.isFetchingTwinData = false;
      }, 1000);
    }
  }

  onNodeUnhover = () => {
    if (this.isFetchingTwinData) {
      this.canRenderPopper = false;
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.canRenderPopper = false;
    this.unhoverTimeout = setTimeout(() => {
      if (!this.canRenderPopper) {
        this.removePopper();
      }
    }, 200);
  }

  removePopper = () => {
    const activePopper = document.querySelector("#cy-popper");
    if (activePopper) {
      activePopper.parentNode.removeChild(activePopper);
    }
  }

  onControlRightClick = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      this.setState({ hideContextMenu: true });
    }
  }

  onControlClicked = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      this.props.onControlClicked(e);
      const { isHighlighting, highlightFilteredNodes, overlayResults, overlayItems } = this.props;
      if (overlayResults) {
        if (this.isSelectingOnOverlay) {
          this.selectNodes(overlayItems.twins);
          this.selectEdges(overlayItems.relationships);
          this.isSelectingOnOverlay = false;
        }
      } else {
        this.clearOverlay();
        this.contextMenu.hideMenuItem("add-relationship");
        this.contextMenuIsOpen = false;
      }
      if (isHighlighting && highlightFilteredNodes) {
        highlightFilteredNodes();
      }
    }
  }

  onControlDoubleClicked = e => {
    if (e.target === this.graphControl && this.props.onControlClicked) {
      const { overlayResults } = this.props;
      if (overlayResults) {
        this.clearOverlay();
        this.props.disableOverlay();
      }
    }
  }

  highlightRelatedNodes() {
    const { overlayItems, overlayResults } = this.props;
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      cy.edges().toggleClass("opaque", true);
      let relatedNodesIds = [];
      this.selectedNodes.forEach(selectedNodeItem => {
        const selectedNode = cy.nodes().filter(n => n.id() === selectedNodeItem.id);
        const connectedEdges = selectedNode.connectedEdges();
        if (!overlayResults || (overlayItems.twins && !overlayItems.twins.some(t => t === selectedNodeItem.id))) {
          connectedEdges.forEach(edge => {
            cy.$id(edge.data().id).toggleClass("highlighted", true);
            cy.$id(edge.data().id).toggleClass("opaque", false);
          });
          const selectedNodeRelatedNodesIds = connectedEdges.map(edge =>
            selectedNode.id() === edge.data().source ? edge.data().target : edge.data().source);
          relatedNodesIds = relatedNodesIds.concat(selectedNodeRelatedNodesIds);
        } else {
          connectedEdges.forEach(edge => {
            if (overlayItems.twins && overlayItems.twins.some(t => t === edge.data().target)) {
              cy.$id(edge.data().id).toggleClass("highlighted", true);
              cy.$id(edge.data().id).toggleClass("opaque", false);
            }
          });
        }
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
    zoomLevel += 0.15;
    this.graphControl.zoom(zoomLevel);
  }

  zoomOut() {
    let zoomLevel = this.graphControl.zoom();
    if (zoomLevel > 0.3) {
      zoomLevel -= 0.15;
      this.graphControl.zoom(zoomLevel);
    }
  }

  highlightNodes(nodeIds, highlightEdges) {
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    cy.edges().toggleClass("opaque", true);
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("opaque", true);
    });
    nodeIds.forEach(id => {
      const selectedNode = cy.nodes().filter(n => n.id() === id);
      cy.$id(selectedNode.id()).toggleClass("opaque", false);
      const connectedEdges = selectedNode.connectedEdges();
      connectedEdges.forEach(edge => {
        const relatedNodeId = id === edge.data().source ? edge.data().target : edge.data().source;
        if (nodeIds.indexOf(relatedNodeId) !== -1) {
          cy.$id(edge.data().id).toggleClass("highlighted", highlightEdges);
          cy.$id(edge.data().id).toggleClass("opaque", false);
        }
      });
    });
  }

  filterNodes = nodes => {
    const cy = this.graphControl;
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("hide", !nodes.some(node => node.$dtId === cyNode.id()));
    });
  }

  clearHighlighting = () => {
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    cy.edges().toggleClass("opaque", false);
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("highlighted", false);
      cy.$id(cyNode.id()).toggleClass("selected", false);
      cy.$id(cyNode.id()).toggleClass("opaque", false);
    });
  }

  emitNodeEvent = (nodeId, event) => {
    this.graphControl.$id(nodeId).emit(event);
  }

  rightClickEdge = edgeId => {
    this.graphControl.$id(edgeId).emit("cxttap");
    const { x, y } = this.graphControl.$id(edgeId).renderedMidpoint();
    this.displayContextMenu("edge", x, y);
  }

  clickEdge = edgeId => {
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    cy.edges().toggleClass("opaque", true);
    cy.$id(edgeId).toggleClass("highlighted", true);
    cy.$id(edgeId).toggleClass("opaque", false);
  }

  rightClickNode = nodeId => {
    const { x, y } = this.graphControl.$id(nodeId).renderedPosition();
    this.contextNode = nodeId;
    this.displayContextMenu("node", x, y, nodeId);
  }

  displayContextMenu = (type, x, y, nodeId) => {
    this.contextMenuItems.forEach(item => {
      const selectors = item.selector.split(", ");
      if (selectors.includes(type)) {
        this.contextMenu.showMenuItem(item.id);
      } else {
        this.contextMenu.hideMenuItem(item.id);
      }
    });
    const contextMenuEl = document.getElementsByClassName("cy-context-menus-cxt-menu")[0];
    const graphHeight = this.graphControl.height();
    const graphWidth = this.graphControl.width();
    const inset = {
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto"
    };
    const getPx = val => typeof val === "string" ? val : `${val}px`;
    if (x > (graphWidth / 2)) {
      inset.right = (graphWidth - x) + 10;
    } else {
      inset.left = x + 10;
    }
    if (y > (graphHeight / 2)) {
      inset.bottom = (graphHeight - y) + 10;
    } else {
      inset.top = y + 10;
    }

    contextMenuEl.style.inset = `${getPx(inset.top)} ${getPx(inset.right)} ${getPx(inset.bottom)} ${getPx(inset.left)}`;
    contextMenuEl.style.display = "block";
    this.setContextMenuState(nodeId);
  }

  render() {
    const { hideContextMenu } = this.state;
    return (
      <div className="cytoscape-wrap">
        <CytoscapeComponent elements={[]}
          className={`graph-control ${hideContextMenu ? "hide-context" : ""}`}
          stylesheet={graphStyles}
          maxZoom={2}
          cy={cy => {
            if (this.graphControl !== cy) {
              this.graphControl = cy;
              addNavigator(this.graphControl, navigationOptions, `#${this.navControlId}`);
              if (this.props.readOnly) {
                return;
              }

              this.graphControl.dblclick();
              this.graphControl.on("mouseover", this.onNodeHover);
              this.graphControl.on("select", "node", this.onNodeSelected);
              this.graphControl.on("unselect", "node", this.onNodeUnselected);
              this.graphControl.on("select", "edge", this.onEdgeSelected);
              this.graphControl.on("click", this.onControlClicked);
              this.graphControl.on("dblclick", this.onControlDoubleClicked);
              this.graphControl.on("dblclick", "node", this.onNodeDoubleClicked);
              this.graphControl.on("cxttap", "node", this.onNodeRightClick);
              this.graphControl.on("cxttap", this.onControlRightClick);
              this.graphControl.on("mouseout", this.onNodeUnhover);
              this.graphControl.on("mousedown", this.onNodeUnhover);
            }
          }} />
        <div className="navigator-container">
          <div id={this.navControlId} className="graph-navigator" role="presentation" />
        </div>
      </div>
    );
  }

}
