// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Stack } from "office-ui-fabric-react/lib/";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import d3Force from "cytoscape-d3-force";
import dblclick from "cytoscape-dblclick";
import popper from "cytoscape-popper";
import navigator from "cytoscape-navigator";
import contextMenus from "cytoscape-context-menus";
import { withTranslation } from "react-i18next";

import { GoldenLayoutComponent } from "./components/GoldenLayoutComponent/GoldenLayoutComponent";
import GraphViewerComponent from "./components/GraphViewerComponent/GraphViewerComponent";
import ModelGraphViewerComponent from "./components/ModelGraphViewerComponent/ModelGraphViewerComponent";
import ModelViewerComponent from "./components/ModelViewerComponent/ModelViewerComponent";
import PropertyInspectorComponent from "./components/PropertyInspectorComponent/PropertyInspectorComponent";
import { OutputComponent } from "./components/OutputComponent/OutputComponent";
import QueryComponent from "./components/QueryComponent/QueryComponent";
import { ImportComponent } from "./components/ImportComponent/ImportComponent";
import { ExportComponent } from "./components/ExportComponent/ExportComponent";
import { ConsoleComponent } from "./components/ConsoleComponent/ConsoleComponent";
import AppCommandBar from "./components/AppCommandBar/AppCommandBar";
import { ErrorMessageComponent } from "./components/ErrorMessageComponent/ErrorMessage";
import LoaderComponent from "./components/LoaderComponent/LoaderComponent";

import Messages from "./messages/messages";
import { eventService } from "./services/EventService";
import logo from "./assets/logo192.png";

import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(fcose);
cytoscape.use(d3Force);
cytoscape.use(dblclick);
cytoscape.use(popper);
cytoscape.use(navigator);
cytoscape.use(contextMenus);

class App extends Component {

  goldenLayoutConfig = {
    dimensions: {
      borderWidth: 3,
      minItemWidth: 285,
      headerHeight: 24
    },
    settings: {
      showPopoutIcon: false,
      showMaximiseIcon: false,
      showCloseIcon: false
    },
    content: [
      {
        type: "column",
        content: [
          {
            type: "stack",
            content: [
              {
                title: this.props.t("app.goldenLayoutConfig.queryComponent"),
                isClosable: false,
                type: "react-component",
                component: "queryComponent",
                setting: {
                  showCloseIcon: false
                }
              }
            ],
            extensions: {
              height: 85
            }
          },
          {
            type: "row",
            height: 100,
            content: [
              {
                title: this.props.t("app.goldenLayoutConfig.modelViewer"),
                isClosable: false,
                width: 15,
                type: "react-component",
                component: "modelViewer",
                setting: {
                  showCloseIcon: false
                }
              },
              {
                type: "stack",
                width: 85,
                content: [
                  {
                    title: this.props.t("app.goldenLayoutConfig.graph"),
                    type: "react-component",
                    isClosable: false,
                    component: "graph",
                    props: {
                      className: "graph-component"
                    },
                    setting: {
                      showCloseIcon: false
                    }
                  },
                  {
                    title: this.props.t("app.goldenLayoutConfig.modelGraphViewer"),
                    type: "react-component",
                    isClosable: false,
                    component: "modelGraphViewer",
                    props: {
                      className: "graph-component"
                    },
                    setting: {
                      showCloseIcon: false
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  optionalComponents = [
    {
      id: "console",
      name: "Console",
      row: 2,
      config: {
        title: this.props.t("optionalComponents.console"),
        type: "react-component",
        component: "consoleComponent",
        id: "consoleComponent"
      }
    },
    {
      id: "output",
      name: "Output",
      row: 2,
      config: {
        title: this.props.t("optionalComponents.output"),
        type: "react-component",
        component: "outputComponent",
        id: "outputComponent"
      }
    }
  ]

  importComponentConfig = {
    title: this.props.t("importComponentConfig.title"),
    type: "react-component",
    component: "importComponent",
    id: "importComponent"
  }

  exportComponentConfig = {
    title: this.props.t("exportComponentConfig.title"),
    type: "react-component",
    component: "exportComponent",
    id: "exportComponent"
  }

  constructor(props) {
    super(props);
    this.goldenLayout = React.createRef();

    this.state = { isLoading: false };
    for (const x of this.optionalComponents) {
      this.state[x.id] = { visible: false };
    }
  }

  componentDidMount() {
    eventService.subscribeImport(evt => {
      const config = { props: { file: evt.file }, ...this.importComponentConfig };
      this.goldenLayout.current.addComponent(config, 1, 1);
    });
    eventService.subscribeExport(evt => {
      const config = { props: { query: evt.query }, ...this.exportComponentConfig };
      this.goldenLayout.current.addComponent(config, 1, 1);
    });
    eventService.subscribeCloseComponent(component => {
      this.goldenLayout.current.removeComponent(component);
    });
    eventService.subscribeOpenOptionalComponent(id => {
      if (!this.state[id].visible) {
        const c = this.optionalComponents.find(x => x.id === id);
        this.goldenLayout.current.addComponent(c.config, c.row);
        this.setState(prevState => ({ [id]: { visible: !prevState[id].visible } }));
      }
    });
    eventService.subscribeLoading(isLoading => this.setState({ isLoading }));
  }

  toggleOptionalComponent = id => {
    const c = this.optionalComponents.find(x => x.id === id);
    if (c) {
      if (this.state[id].visible) {
        this.goldenLayout.current.removeComponent(c.config.component);
      } else {
        this.goldenLayout.current.addComponent(c.config, c.row);
      }
      this.setState(prevState => ({ [id]: { visible: !prevState[id].visible } }));
    }
  }

  onGoldenLayoutItemDestroyed = item => {
    if (item.config && item.config.type === "component") {
      eventService.publishComponentClosed(item.config.component);
    }
  }

  onGoldenLayoutTabCreated = tab => {
    const componentName = tab.contentItem.config.component;
    const c = this.optionalComponents.find(x => x.config.component === componentName);
    if (c) {
      tab.closeElement.click(() => {
        this.setState({ [c.id]: false });
      });
    }
  }

  goldenLayoutComponentError = (error, componentStack) =>
    console.error(Messages.error.render(error, componentStack, "GraphViewerCommandBar Component")) // eslint-disable-line no-console

  renderErrorPage = () => (
    <div className="error-page">
      <span>{this.props.t("errorPage")}</span>
    </div>)

  render() {
    const optionalComponentsState = this.optionalComponents.reduce((p, c) => {
      p[c.id] = this.state[c.id];
      return p;
    }, {});
    const { isLoading } = this.state;
    return (
      <>
        <ErrorBoundary onError={this.goldenLayoutComponentError} fallbackRender={this.renderErrorPage}>
          <div className="main-grid">
            <div className="header">
              <Stack horizontal className="top-bar">
                <div>
                  <img src={logo} width={20} height={20} alt="" />
                  <span className="top-bar-title">Azure Digital Twins Explorer</span>
                </div>
                <AppCommandBar optionalComponents={this.optionalComponents}
                  optionalComponentsState={optionalComponentsState}
                  toggleOptionalComponent={this.toggleOptionalComponent} />
              </Stack>
            </div>
            <GoldenLayoutComponent
              ref={this.goldenLayout}
              htmlAttrs={{ className: "work-area" }}
              config={this.goldenLayoutConfig}
              onTabCreated={this.onGoldenLayoutTabCreated}
              onItemDestroyed={this.onGoldenLayoutItemDestroyed}
              registerComponents={gLayout => {
                gLayout.registerComponent("graph", GraphViewerComponent);
                gLayout.registerComponent("modelGraphViewer", ModelGraphViewerComponent);
                gLayout.registerComponent("modelViewer", ModelViewerComponent);
                gLayout.registerComponent("propInspector", PropertyInspectorComponent);
                gLayout.registerComponent("outputComponent", OutputComponent);
                gLayout.registerComponent("queryComponent", QueryComponent);
                gLayout.registerComponent("importComponent", ImportComponent);
                gLayout.registerComponent("exportComponent", ExportComponent);
                gLayout.registerComponent("consoleComponent", ConsoleComponent);
              }} />
          </div>
        </ErrorBoundary>
        <ErrorMessageComponent />
        { isLoading && <LoaderComponent /> }
      </>
    );
  }

}

export default withTranslation()(App);
