// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

import { graphStyles, modelWithImageStyle, minZoomShowLabels, ellipsisMaxTextLength, ellipsisMaxTextLengthWithImage } from "./config";
import { colors, dagreOptions, colaOptions, klayOptions, fcoseOptions, d3ForceOptions, navigationOptions } from "../../../config/CytoscapeConfig";
import { settingsService } from "../../../services/SettingsService";
import { addNavigator } from "../../../utils/utilities";

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
    this.state = {
      hideContextMenu: false
    };
    this.graphControl = null;
    this.selectedNodes = [];
    this.layout = "d3Force";
    this.hoverTimeout = null;
    this.isHidingLabels = false;
    this.hiddenTextRuler = React.createRef();
    this.canRenderPopper = false;
    this.contextMenuItems = [
      {
        id: "show-source",
        content: "Show source",
        selector: "edge",
        onClickFunction: this.onShowSource
      },
      {
        id: "show-destination",
        content: "Show destination",
        selector: "edge",
        onClickFunction: this.onShowDestination
      },
      {
        id: "scale-to-rel",
        content: "Scale to relationship",
        selector: "edge",
        onClickFunction: this.onScaleToRel
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

  addNodes(nodes) {
    const mapped = nodes
      .filter(x => this.graphControl.$id(x.id).length === 0)
      .map(x => ({
        data: {
          id: x.id,
          label: this.getTextWidth(x.label) > ellipsisMaxTextLength ? this.ellipsisText(x.label, x.id) : x.label,
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
          relationshipId: x.relationshipId,
          id: `${x.sourceId}_${x.targetId}_${x.relationshipName}`
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
      this.graphControl.$id(`${x.sourceId}_${x.targetId}_${x.relationshipName}`).remove();
    });
  }

  getColor(i) {
    const im = i % colors.length;
    return (colors[(colors.length - 1) - im]);
  }

  getBackgroundImage(modelId) {
    return settingsService.getModelImage(modelId);
  }

  doLayout(progressCallback) {
    const cy = this.graphControl;
    cy.batch(() => {
      const el = cy.nodes("*");
      // Add model images
      for (let i = 0; i < el.length; i++) {
        const modelId = el[i].data("id");
        const backgroundImage = this.getBackgroundImage(modelId);
        if (backgroundImage) {
          cy.elements(`node[id="${modelId}"]`).style({
            "background-image": `url(${backgroundImage})`,
            ...modelWithImageStyle
          });
        } else {
          cy.elements(`node[id="${modelId}"]`).style({
            ...modelWithImageStyle
          });
        }
      }
    });

    return new Promise(resolve => {
      const options = ModelGraphViewerCytoscapeLayouts[this.layout];
      if (progressCallback && options.tick) {
        options.tick = progressCallback;
      }
      const layout = cy.layout(options);
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
      cy.elements(`node[id="${modelId}"]`).style({
        "background-image": `url(${backgroundImage})`,
        ...modelWithImageStyle
      });
    } else {
      cy.elements(`node[id="${modelId}"]`).style({
        ...modelWithImageStyle
      });
    }
  }

  onNodeSelected = ({ target: node }) => {
    const { onNodeClicked } = this.props;
    this.selectedNodes.push({ id: node.id() });
    this.highlightRelatedNodes();
    if (onNodeClicked) {
      onNodeClicked(node.id());
    }
  }

  onNodeUnselected = e => {
    const removed = this.selectedNodes.findIndex(x => x.id === e.target.id());
    if (removed >= 0) {
      this.selectedNodes.splice(removed, 1);
      this.highlightRelatedNodes();
    }
  }

  onEdgeSelected = e => {
    this.props.onEdgeClicked(e.target.data());
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
    if (e.target === this.graphControl) {
      const { isHighlighting, highlightFilteredNodes } = this.props;
      if (isHighlighting && highlightFilteredNodes) {
        highlightFilteredNodes();
      } else {
        this.clearHighlighting();
      }
      if (this.props.onControlClicked) {
        this.props.onControlClicked(e);
      }
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
    }
  }

  highlightNodes(nodes, highlightEdges) {
    const nodesIds = nodes.map(node => node.id);
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    cy.edges().toggleClass("opaque", true);
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("opaque", true);
    });
    nodes.forEach(node => {
      const selectedNode = cy.nodes().filter(n => node && n.id() === node.id);
      cy.$id(selectedNode.id()).toggleClass("opaque", false);
      cy.$id(selectedNode.id()).toggleClass("highlighted", true);
      const connectedEdges = selectedNode.connectedEdges();
      connectedEdges
        .forEach(edge => {
          if (nodesIds.includes(edge.data().source)
            && nodesIds.includes(edge.data().target)) {
            cy.$id(edge.data().id).toggleClass("highlighted", highlightEdges);
            cy.$id(edge.data().id).toggleClass("opaque", false);
          }
        });
    });
  }

  clearHighlighting = () => {
    const cy = this.graphControl;
    cy.edges().toggleClass("highlighted", false);
    cy.edges().toggleClass("opaque", false);
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("highlighted", false);
      cy.$id(cyNode.id()).toggleClass("opaque", false);
    });
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

  onNodeUnhover = () => {
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

  onNodeHover = ({ target }) => {
    this.removePopper();
    if (target !== this.graphControl) {
      const { category, source, relationshipId } = target.data();
      if (category === "Model" && this.props.onNodeMouseEnter) {
        this.canRenderPopper = true;
        this.hoverTimeout = setTimeout(async () => {
          if (this.canRenderPopper) {
            const { properties, telemetries } = await this.props.onNodeMouseEnter(target.id());
            const contentDiv = this.getPopperContent(target.id(), properties, telemetries);
            document.body.appendChild(contentDiv);
            this.renderPopper(target.id(), contentDiv);
          }
        }, 1000);
      } else if (source && this.props.onEdgeMouseEnter) {
        this.canRenderPopper = true;
        this.hoverTimeout = setTimeout(async () => {
          if (this.canRenderPopper) {
            const relationship = await this.props.onEdgeMouseEnter(source, relationshipId);
            const contentDiv = this.getPopperRelationshipContent(target.data(), relationship);
            document.body.appendChild(contentDiv);
            this.renderPopper(target.id(), contentDiv);
          }
        }, 1000);
      }
    }
  }

  getContents = (properties, telemetries) => {
    let definedProperties = "";
    let definedTelemetries = "";
    for (const [ key ] of Object.entries(properties)) {
      definedProperties += `<li>${key}</li>`;
    }
    if (telemetries) {
      telemetries.forEach(r => definedTelemetries += `<li>${r.name}</li>`);
    }
    return { definedTelemetries, definedProperties };
  }

  getRelationshipsContents = properties => {
    let definedProperties = "";
    for (const prop of properties) {
      definedProperties += `<li>${prop}</li>`;
    }
    return { definedProperties };
  }

  getPopperContent = (modelId, properties, telemetries) => {
    const { definedProperties, definedTelemetries } = this.getContents(properties, telemetries);
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
        <p>${modelId}</p>
      </div>
      ${definedProperties && `<div>
        <h4>PROPERTIES</h4>
        <ul>${definedProperties}</ul>
      </div>`}
      ${definedTelemetries && `<div>
        <h4>TELEMETRY</h4>
        <ul>${definedTelemetries}</ul>
      </div>`}`;

    return div;
  };

  getPopperRelationshipContent = (data, relationship) => {
    const {source, target, label } = data;
    const properties = relationship.properties || [];
    const { definedProperties } = this.getRelationshipsContents(properties);
    const div = document.createElement("div");
    div.setAttribute("id", "cy-popper");
    div.addEventListener("mouseenter", () => {
      this.canRenderPopper = true;
    });
    div.addEventListener("mouseleave", () => {
      this.canRenderPopper = false;
      this.removePopper();
    });

    if (relationship.componentModel) {
      div.innerHTML = `
        <div>
          <h4>HOST MODEL:</h4>
          <p>${source}</p>
        </div>
        <div>
          <h4>COMPONENT NAME:</h4>
          <p>${relationship.name}</p>
        </div>
        <div>
          <h4>COMPONENT MODEL:</h4>
          <p>${relationship.componentModel}</p>
        </div>
      `;
    } else if (relationship.baseModel) {
      div.innerHTML = `
        <div>
          <h4>EXTENDED MODEL:</h4>
          <p>${source}</p>
        </div>
        <div>
          <h4>EXTENDS</h4>
        </div>
        <div>
          <h4>BASE MODEL:</h4>
          <p>${relationship.baseModel}</p>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div>
          <h4>SOURCE ID:</h4>
          <p>${source}</p>
        </div>
        ${label && `<div>
          <h4>RELATIONSHIP NAME:</h4>
          <p>${label}</p>
        </div>`}
        ${target && `<div>
          <h4>TARGET ID:</h4>
          <p>${target}</p>
        </div>`}
      ${definedProperties && `<div>
        <h4>PROPERTIES</h4>
        <ul>${definedProperties}</ul>
      `}`;
    }

    return div;
  };

  removePopper = () => {
    const activePopper = document.querySelector("#cy-popper");
    if (activePopper) {
      activePopper.parentNode.removeChild(activePopper);
    }
  }

  renderPopper = (nodeId, content) => {
    const cy = this.graphControl;
    cy.$id(nodeId).popper({
      content,
      popper: {}
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

  filterNodes = nodes => {
    const cy = this.graphControl;
    const cleanNodes = nodes.filter(n => n && n.id);
    cy.nodes().forEach(cyNode => {
      cy.$id(cyNode.id()).toggleClass("hide", !cleanNodes.some(node => node.id === cyNode.id()));
    });
  }

  onGraphZoom = () => {
    const cy = this.graphControl;
    if (cy.zoom() <= minZoomShowLabels && !this.isHidingLabels) {
      this.isHidingLabels = true;
      cy.edges().toggleClass("hide-label", true);
    } else {
      this.isHidingLabels = false;
      cy.edges().not(cy.$(".extends"))
        .toggleClass("hide-label", false);
    }
  }

  ellipsisText = (text, modelId) => {
    const backgroundImage = this.getBackgroundImage(modelId);
    const ellipsisLength = this.getTextWidth("...");
    const maxLength = backgroundImage ? (ellipsisMaxTextLengthWithImage - ellipsisLength) : (ellipsisMaxTextLength - ellipsisLength);
    return `...${this.cutTextToMaxLength(text, maxLength)}`;
  }

  getTextWidth = text => {
    this.hiddenTextRuler.current.innerHTML = text;
    const offsetWidth = this.hiddenTextRuler.current.offsetWidth;
    this.hiddenTextRuler.current.innerHTML = "";
    return offsetWidth;
  }

  cutTextToMaxLength = (text, maxLength) => {
    let length = this.getTextWidth(text);
    let cutText = text.slice(Math.floor((length - maxLength) / length * text.length), text.length);
    length = this.getTextWidth(cutText);
    while (length > maxLength) {
      const lastIndex = cutText.length;
      cutText = cutText.slice(1, lastIndex);
      length = this.getTextWidth(cutText);
    }
    return cutText;
  }

  onEdgeRightClick = () => {
    this.setState({ hideContextMenu: false });
    this.onNodeUnhover();
  }

  onNodeRightClick = () => {
    this.setState({ hideContextMenu: this.contextMenuItems.every(i => i.selector === "edge") });
  }

  onControlRightClick = e => {
    if (e.target === this.graphControl) {
      this.setState({ hideContextMenu: true });
    }
  }

  onShowDestination = e => {
    const target = e.target || e.cyTarget;
    const cy = this.graphControl;
    cy.animate({
      fit: {
        eles: cy.$id(target.target().id())
      }
    });
  }

  onShowSource = e => {
    const target = e.target || e.cyTarget;
    const cy = this.graphControl;
    cy.animate({
      fit: {
        eles: cy.$id(target.source().id())
      }
    });
  }

  onScaleToRel = e => {
    const target = e.target || e.cyTarget;
    const cy = this.graphControl;
    cy.animate({
      fit: {
        eles: cy.$(`[id = "${target.source().id()}"], [id = "${target.target().id()}"]`)
      }
    });
  }

  emitNodeEvent = (nodeId, event) => {
    this.graphControl.$id(nodeId).emit(event);
  }

  render() {
    const { hideContextMenu } = this.state;
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <CytoscapeComponent elements={[]}
          className={`graph-control ${hideContextMenu ? "hide-context" : ""}`}
          stylesheet={graphStyles}
          maxZoom={2}
          cy={cy => {
            if (this.graphControl !== cy) {
              this.graphControl = cy;
              addNavigator(this.graphControl, navigationOptions, "#model-graph-viewer-nav");
              this.graphControl.dblclick();
              this.graphControl.on("select", "node", this.onNodeSelected);
              this.graphControl.on("unselect", "node", this.onNodeUnselected);
              this.graphControl.on("select", "edge", this.onEdgeSelected);
              this.graphControl.on("click", this.onControlClicked);
              this.graphControl.on("dblclick", "node", this.onNodeDoubleClicked);
              this.graphControl.on("mouseover", this.onNodeHover);
              this.graphControl.on("mouseout", this.onNodeUnhover);
              this.graphControl.on("mousedown", this.onNodeUnhover);
              this.graphControl.on("zoom", this.onGraphZoom);
              this.graphControl.on("cxttap", "edge", this.onEdgeRightClick);
              this.graphControl.on("cxttap", "node", this.onNodeRightClick);
              this.graphControl.on("cxttap", this.onControlRightClick);
            }
          }} />
        <div className="navigator-container">
          <div id="model-graph-viewer-nav" className="graph-navigator" role="presentation" />
        </div>
        <div id="hidden-text-ruler" ref={this.hiddenTextRuler} />
      </div>
    );
  }

}
