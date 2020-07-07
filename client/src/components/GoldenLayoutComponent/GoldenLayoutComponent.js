// This component is based on the bug fix suggested by
// pmunin here: 
// https://github.com/golden-layout/golden-layout/issues/392
import React, { Component } from "react";
import ReactDOM from "react-dom";
import GoldenLayout from "golden-layout";

import { eventService } from "../../services/EventService";

import "golden-layout/src/css/goldenlayout-base.css";
import "./CustomTheme.scss";
import $ from "jquery";

window.$ = $;
window.jQuery = $;
window.jquery = $;

export class GoldenLayoutComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.containerRef = React.createRef();
    this.goldenLayoutInstance = null;
  }

  render() {
    const panels = Array.from(this.state.renderPanels || []);
    const { htmlAttrs } = this.props;
    return (
      <div ref={this.containerRef} {...htmlAttrs}>
        {panels.map(panel => ReactDOM.createPortal(
          panel._getReactComponent(),
          panel._container.getElement()[0]))}
      </div>
    );
  }

  componentRender(reactComponentHandler) {
    this.setState(state => {
      const newRenderPanels = new Set(state.renderPanels);
      newRenderPanels.add(reactComponentHandler);
      return { renderPanels: newRenderPanels };
    });
  }

  componentDestroy(reactComponentHandler) {
    this.setState(state => {
      const newRenderPanels = new Set(state.renderPanels);
      newRenderPanels.delete(reactComponentHandler);
      return { renderPanels: newRenderPanels };
    });
  }

  updateDimensions = () => {
    const newWidth = window.innerWidth - 4;
    const newHeight = window.innerHeight - 34;

    const current = (this.goldenLayoutInstance.root
      ? this.goldenLayoutInstance.root.contentItems[0].contentItems.map(x => x.config)
      : this.goldenLayoutInstance.config.content[0].content)
      .filter(x => x.content.length > 0);

    if (current.some(x => x.extensions && x.extensions.height)) {
      let totalFixedHeight = 0;
      let totalAllocatedHeight = 0;
      current
        .forEach(x => {
          if (x.extensions && x.extensions.height) {
            x.height = (x.extensions.height / newHeight) * 100;
            totalFixedHeight += x.height;
          } else {
            totalAllocatedHeight += x.height;
          }
        });

      current
        .filter(x => !x.extensions || !x.extensions.height)
        .forEach(x => x.height = Math.max(100 - totalFixedHeight, 0) * (x.height / totalAllocatedHeight));
    }

    this.goldenLayoutInstance.updateSize(newWidth, newHeight);
  }

  componentDidMount() {
    this.goldenLayoutInstance = new GoldenLayout(
      this.props.config || {},
      this.containerRef.current
    );

    eventService.initialize(this.goldenLayoutInstance.eventHub);

    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
    if (this.props.registerComponents instanceof Function) {
      this.props.registerComponents(this.goldenLayoutInstance);
    }

    this.goldenLayoutInstance.reactContainer = this;
    this.goldenLayoutInstance.init();
    this.goldenLayoutInstance.on("tabCreated", this.props.onTabCreated);
    this.goldenLayoutInstance.on("itemDestroyed", () => this.updateDimensions());
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  addComponent = (config, rowIndex = 99, stackIndex = 99, rowHeight = 30) => {
    const root = this.goldenLayoutInstance.root.contentItems[0];
    const newRowIndex = Math.min(root.contentItems.length, rowIndex);

    let item = root.contentItems[newRowIndex];
    if (!item) {
      root.addChild({ type: "row", height: rowHeight });
      item = root.contentItems[newRowIndex];
    }

    if (item) {
      if (item.isStack) {
        item.parent.replaceChild(item, { type: "row", config: {} });
        root.contentItems[newRowIndex].addChild(item);
        item = root.contentItems[newRowIndex];
      }

      if (item.isRow) {
        const newStackIndex = Math.min(item.contentItems.length, stackIndex);
        if (newStackIndex >= item.contentItems.length) {
          item.addChild({ type: "stack" });
        }

        item = item.contentItems[newStackIndex];
      }

      item.addChild(config);
    }

    this.updateDimensions();
  }

  removeComponent = componentName => {
    const items = [ this.goldenLayoutInstance.root.contentItems[0] ];

    for (let i = 0; i < items.length; i++) {
      const current = items[i];

      if (current.isComponent && current.config.id === componentName) {
        current.remove();
        break;
      }

      if (current.contentItems) {
        current.contentItems.forEach(x => items.push(x));
      }
    }
  }

}

//Patching internal GoldenLayout.__lm.utils.ReactComponentHandler:

const ReactComponentHandler = GoldenLayout.__lm.utils.ReactComponentHandler;

class ReactComponentHandlerPatched extends ReactComponentHandler {

  _render() {
    // Instance of GoldenLayoutComponent class
    const reactContainer = this._container.layoutManager.reactContainer;
    if (reactContainer && reactContainer.componentRender) {
      reactContainer.componentRender(this);
    }
  }

  _destroy() {
    this._container.off("open", this._render, this);
    this._container.off("destroy", this._destroy, this);
  }

  _getReactComponent() {
    // The following method is absolute copy of the original, provided to prevent depenency on window.React
    const defaultProps = {
      glEventHub: this._container.layoutManager.eventHub,
      glContainer: this._container
    };
    const props = $.extend(defaultProps, this._container._config.props);
    return React.createElement(this._reactClass, props);
  }

}

GoldenLayout.__lm.utils.ReactComponentHandler = ReactComponentHandlerPatched;
