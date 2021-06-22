// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Pivot, PivotItem, Stack, Customizations } from "office-ui-fabric-react/lib/";
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

import GraphViewerComponent from "./components/GraphViewerComponent/GraphViewerComponent";
import ModelGraphViewerComponent from "./components/ModelGraphViewerComponent/ModelGraphViewerComponent";
import ModelViewerComponent from "./components/ModelViewerComponent/ModelViewerComponent";
import { TwinViewerComponent } from "./components/TwinViewerComponent/TwinViewerComponent";
import { OutputComponent } from "./components/OutputComponent/OutputComponent";
import QueryComponent from "./components/QueryComponent/QueryComponent";
import { ImportComponent } from "./components/ImportComponent/ImportComponent";
import { ExportComponent } from "./components/ExportComponent/ExportComponent";
import { ConsoleComponent } from "./components/ConsoleComponent/ConsoleComponent";
import AppCommandBar from "./components/AppCommandBar/AppCommandBar";
import { ErrorMessageComponent } from "./components/ErrorMessageComponent/ErrorMessage";
import LoaderComponent from "./components/LoaderComponent/LoaderComponent";

import { eventService } from "./services/EventService";
import { settingsService } from "./services/SettingsService";
import themeVariables from "./theme/variables";
import { darkFabricTheme, darkFabricThemeHighContrast } from "./theme/DarkFabricTheme";
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

const layoutConfig = {
  borderWidth: 3,
  minItemWidth: 15,
  headerHeight: 24,
  minDrawerHeight: 20,
  maxDrawerHeight: 300
};

const CLOSING_BRACKET_KEY_CODE = 221;

const contrastOptions = {
  high: "high-contrast",
  normal: "normal"
};

class App extends Component {

  optionalComponents = [
    {
      id: "console",
      name: this.props.t("app.optionalComponents.console"),
      showProp: "showConsole"
    },
    {
      id: "output",
      name: this.props.t("app.optionalComponents.output"),
      showProp: "showOutput"
    }
  ]

  constructor(props) {
    super(props);
    this.resizeModelViewerStartX = 0;
    this.resizeModelViewerEndX = 0;
    this.resizeDrawerStartY = 0;
    this.resizeDrawerEndY = 0;
    this.modelGraphViewer = React.createRef();
    this.state = {
      isLoading: false,
      layout: {
        modelViewerWidth: 15,
        drawerHeight: 20,
        showImport: false,
        importFile: null,
        showExport: false,
        showOutput: false,
        showConsole: false
      },
      mainContentSelectedKey: "graph-viewer",
      leftPanelSelectedKey: "models",
      contrast: contrastOptions.normal
    };
    for (const x of this.optionalComponents) {
      this.state[x.id] = { visible: false };
    }
    this.setCurrentContrast();
  }

  componentDidMount() {
    eventService.subscribeImport(evt => {
      this.setState(prevState => ({ layout: { ...prevState.layout, showImport: true, importFile: evt.file } }));
    });
    eventService.subscribeExport(() => {
      this.setState({ showExport: true });
    });
    eventService.subscribeCloseComponent(component => {
      switch (component) {
        case "importComponent":
          this.setState({ showImport: false });
          break;
        default:
          break;
      }
    });
    eventService.subscribeOpenOptionalComponent(id => {
      switch (id) {
        case "output":
          this.setState({ showOutput: false });
          break;
        case "console":
          this.setState({ showConsole: false });
          break;
        default:
          break;
      }
    });
    eventService.subscribeLoading(isLoading => this.setState({ isLoading }));
    window.addEventListener("keydown", e => {
      if (e.keyCode === CLOSING_BRACKET_KEY_CODE && e.ctrlKey) {
        eventService.publishClearGraphSelection();
        eventService.publishSelection();
        eventService.publishModelSelectionUpdatedInGraph();
      }
    });
    this.applyStoredContrast();
  }

  applyStoredContrast = () => {
    const contrast = settingsService.contrast;
    if (contrast && contrast !== this.state.contrast) {
      this.setState({ contrast },
        () => this.setCurrentContrast());
    }
  }

  setCurrentContrast = () => {
    const { contrast } = this.state;
    this.setThemeVariables(themeVariables[contrast]);
    if (contrast === contrastOptions.high) {
      Customizations.applySettings({ theme: darkFabricThemeHighContrast });
    } else {
      Customizations.applySettings({ theme: darkFabricTheme });
    }
  }

  setThemeVariables = theme => {
    Object.keys(theme).forEach(key => {
      document.documentElement.style.setProperty(key, theme[key]);
    });
  }

  toggleOptionalComponent = id => {
    this.setState(prevState => {
      const newState = { ...prevState };
      switch (id) {
        case "output":
          newState.layout.showOutput = !prevState.layout.showOutput;
          break;
        case "console":
          newState.layout.showConsole = !prevState.layout.showConsole;
          break;
        default:
          break;
      }
      return newState;
    });
  }

  handleModelViewerResizeMouseMove = e => {
    this.resizeModelViewerEndX = e.screenX - this.resizeModelViewerStartX;
    if (this.resizeModelViewerEndX >= layoutConfig.minItemWidth) {
      this.setState(prevState => ({
        layout: { ...prevState.layout, modelViewerWidth: layoutConfig.minItemWidth + ((this.resizeModelViewerEndX * 100) / window.innerWidth) }
      }));
    }
  };

  handleModelViewerResizeMouseUp = e => {
    e.preventDefault();
    window.removeEventListener("mousemove", this.handleModelViewerResizeMouseMove);
    window.removeEventListener("mouseup", this.handleModelViewerResizeMouseUp);
  };

  handleModelViewerResizeMouseDown = e => {
    e.preventDefault();
    if (this.resizeModelViewerStartX === 0) {
      this.resizeModelViewerStartX = e.screenX;
    }
    window.addEventListener("mousemove", this.handleModelViewerResizeMouseMove);
    window.addEventListener("mouseup", this.handleModelViewerResizeMouseUp);
  };


  handleDrawerResizeMouseMove = e => {
    this.resizeDrawerEndY = this.resizeDrawerStartY - e.screenY;
    if (this.resizeDrawerEndY >= layoutConfig.minDrawerHeight && this.resizeDrawerEndY <= layoutConfig.maxDrawerHeight) {
      this.setState(prevState => ({
        layout: { ...prevState.layout, drawerHeight: layoutConfig.minDrawerHeight + ((this.resizeDrawerEndY * 100) / window.innerHeight) }
      }));
    }
  };

  handleDrawerResizeMouseUp = e => {
    e.preventDefault();
    window.removeEventListener("mousemove", this.handleDrawerResizeMouseMove);
    window.removeEventListener("mouseup", this.handleDrawerResizeMouseUp);
  };

  handleDrawerResizeMouseDown = e => {
    e.preventDefault();
    if (this.resizeDrawerStartY === 0) {
      this.resizeDrawerStartY = e.screenY;
    }
    window.addEventListener("mousemove", this.handleDrawerResizeMouseMove);
    window.addEventListener("mouseup", this.handleDrawerResizeMouseUp);
  };

  handleMainContentPivotChange = item => {
    const itemKey = item.props.itemKey;
    if (itemKey === "model-graph-viewer") {
      this.modelGraphViewer.current.initialize();
    }
    this.setState(prevState => ({
      mainContentSelectedKey: itemKey,
      leftPanelSelectedKey: itemKey === "model-graph-viewer" ? "models" : prevState.leftPanelSelectedKey
    }));
  }

  handleLeftPanelPivotChange = item => {
    const itemKey = item.props.itemKey;
    this.setState(prevState => ({
      leftPanelSelectedKey: itemKey,
      mainContentSelectedKey: itemKey === "twins" ? "graph-viewer" : prevState.mainContentSelectedKey
    }));
  }

  toggleHighContrastMode = isHighContrast => {
    const contrast = isHighContrast ? contrastOptions.high : contrastOptions.normal;
    settingsService.contrast = contrast;
    this.setState({ contrast },
      () => this.setCurrentContrast());
  }

  renderErrorPage = () => (
    <div className="error-page">
      <span>{this.props.t("errorPage")}</span>
    </div>)

  render() {
    const { isLoading, layout, mainContentSelectedKey, leftPanelSelectedKey, contrast } = this.state;
    const optionalComponentsState = this.optionalComponents.map(p => {
      p.show = layout[p.showProp];
      return p;
    });
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
                <AppCommandBar optionalComponents={optionalComponentsState}
                  optionalComponentsState={optionalComponentsState}
                  toggleOptionalComponent={this.toggleOptionalComponent}
                  toggleHighContrastMode={this.toggleHighContrastMode}
                  contrast={contrast} />
              </Stack>
            </div>
            <Stack className="work-area">
              <div className="top-area">
                <Pivot aria-label="Use left and right arrow keys to navigate" className="tab-pivot">
                  <PivotItem headerText={this.props.t("app.goldenLayoutConfig.queryComponent")}>
                    <QueryComponent />
                  </PivotItem>
                </Pivot>
              </div>
              <div className="main-area" style={{ height: `calc(100vh - 155px - ${(layout.showConsole || layout.showOutput) ? layout.drawerHeight : 0}%)` }}>
                <Stack horizontal style={{ height: "100%" }}>
                  <div style={{width: `${layout.modelViewerWidth}%` }}>
                    <Pivot aria-label="Use left and right arrow keys to navigate" selectedKey={leftPanelSelectedKey} className="tab-pivot" headersOnly onLinkClick={this.handleLeftPanelPivotChange}>
                      <PivotItem itemKey="twins" headerText={this.props.t("app.goldenLayoutConfig.twinViewer")} />
                      <PivotItem style={{ height: "100%" }} itemKey="models" headerText={this.props.t("app.goldenLayoutConfig.modelViewer")} />
                    </Pivot>
                    <div className="tab-pivot-panel">
                      <div className={leftPanelSelectedKey === "twins" ? "show" : "hidden"}>
                        <TwinViewerComponent />
                      </div>
                      <div className={leftPanelSelectedKey === "models" ? "show" : "hidden"}>
                        <ModelViewerComponent showItemMenu={mainContentSelectedKey === "graph-viewer"} />
                      </div>
                    </div>
                  </div>
                  <div
                    className="draggable"
                    onMouseDown={this.handleModelViewerResizeMouseDown} />
                  <div style={{ width: `calc(${100 - layout.modelViewerWidth}% - 3px)`, flex: 1 }}>
                    <Pivot aria-label="Use left and right arrow keys to navigate" selectedKey={mainContentSelectedKey}
                      className="tab-pivot" headersOnly onLinkClick={this.handleMainContentPivotChange}>
                      <PivotItem style={{ height: "100%" }} itemKey="graph-viewer" headerText={this.props.t("app.goldenLayoutConfig.graph")} />
                      <PivotItem style={{ height: "100%" }} itemKey="model-graph-viewer" headerText={this.props.t("app.goldenLayoutConfig.modelGraphViewer")} />
                      {layout.showImport && <PivotItem style={{ height: "100%" }} key="import" headerText={this.props.t("app.importComponentConfig.title")} />}
                      {layout.showExport && <PivotItem style={{ height: "100%" }} key="export" headerText={this.props.t("app.exportComponentConfig.title")} />}
                    </Pivot>
                    <div className="tab-pivot-panel">
                      <div className={mainContentSelectedKey === "graph-viewer" ? "show" : "hidden"}>
                        <GraphViewerComponent />
                      </div>
                      <div className={mainContentSelectedKey === "model-graph-viewer" ? "show" : "hidden"}>
                        <ModelGraphViewerComponent ref={this.modelGraphViewer} />
                      </div>
                      {layout.showImport && <div>
                        <ImportComponent file={layout.importFile} />
                      </div>}
                      {layout.showExport && <div>
                        <ExportComponent />
                      </div>}
                    </div>
                  </div>
                </Stack>
              </div>
              <div className="bottom-area" style={{ height: `${(layout.showConsole || layout.showOutput) ? layout.drawerHeight : 0}%` }}>
                <div
                  className="draggable horizontal"
                  onMouseDown={this.handleDrawerResizeMouseDown} />
                <div className="bottom-area-content">
                  {layout.showOutput && <div>
                    <Pivot aria-label="Use left and right arrow keys to navigate" className="tab-pivot full-height">
                      <PivotItem
                        headerText={this.props.t("app.optionalComponents.output")}>
                        <OutputComponent />
                      </PivotItem>
                    </Pivot>
                  </div>}
                  {layout.showConsole && <div>
                    <Pivot aria-label="Use left and right arrow keys to navigate" className="tab-pivot full-height">
                      <PivotItem
                        headerText={this.props.t("app.optionalComponents.console")}>
                        <ConsoleComponent />
                      </PivotItem>
                    </Pivot>
                  </div>}
                </div>
              </div>
            </Stack>
          </div>
        </ErrorBoundary>
        <ErrorMessageComponent />
        { isLoading && <LoaderComponent /> }
      </>
    );
  }

}

export default withTranslation()(App);
