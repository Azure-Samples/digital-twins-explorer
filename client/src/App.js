/* eslint-disable */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Pivot, PivotItem, Stack, Customizations, Icon, Text } from "office-ui-fabric-react/lib/";
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
import { ModelService } from "./services/ModelService";
import themeVariables from "./theme/variables";
import { darkFabricTheme, darkFabricThemeHighContrast } from "./theme/DarkFabricTheme";
import logo from "./assets/logo192.png";

import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import ModelUploadMessageBar from "./components/ModelUploadMessageBar/ModelUploadMessageBar";
import { STRING_DTDL_TYPE } from "./services/Constants";
import ErrorPage from "./components/ErrorPage/ErrorPage";

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


const LEFT_ARROW_KEY_CODE = 37;
const RIGHT_ARROW_KEY_CODE = 39;
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
    this.importRef = React.createRef();
    this.state = {
      exportedQuery: "",
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
      modelUploadResults: null,
      mainContentSelectedKey: "graph-viewer",
      leftPanelSelectedKey: "models",
      contrast: contrastOptions.normal,
      possibleDisplayNameProperties: [],
      selectedDisplayNameProperty: ""
    };
    for (const x of this.optionalComponents) {
      this.state[x.id] = { visible: false };
    }
    this.setCurrentContrast();
  }

  async componentDidMount() {
    eventService.subscribeImport(evt => {
      this.setState(prevState => ({ layout: { ...prevState.layout, showImport: true, importFile: evt.file } }), () => {
        this.setState({ mainContentSelectedKey: "import" }, () => {
          setTimeout(() => {
            this.importRef.current.focus();
          }, 200);
        });
      });
    });
    eventService.subscribeExport((evt) => {
      this.setState(prevState => ({ layout: { ...prevState.layout, showExport: true }, exportedQuery: evt.query }), () => {
        this.setState({ mainContentSelectedKey: "export" });
      });
    });
    eventService.subscribeCloseComponent(component => {
      switch (component) {
        case "importComponent":
          this.setState(prevState => ({ layout: { ...prevState.layout, showImport: false, importFile: null } }), () => {
            this.handleMainContentPivotChange("graph-viewer");
          });
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

    eventService.subscribeConfigure(async evt => {
      if (evt.type === "end" && evt.config) {
        await this.setPossibleDisplayNameProperties();
        await this.applyStoredDisplayNameProperty();
      }
    });
    
    window.addEventListener("keydown", e => {
      if (e.keyCode === CLOSING_BRACKET_KEY_CODE && e.ctrlKey) {
        eventService.publishClearGraphSelection();
        eventService.publishSelection();
        eventService.publishModelSelectionUpdatedInGraph();
      }
    });
    this.applyStoredContrast();
    await this.setPossibleDisplayNameProperties();
    await this.applyStoredDisplayNameProperty();
  }

  applyStoredContrast = () => {
    const contrast = settingsService.contrast;
    if (contrast && contrast !== this.state.contrast) {
      this.setState({ contrast },
        () => this.setCurrentContrast());
    }
  }

  applyStoredDisplayNameProperty = () => {
    (async () => {
      const prospectiveDisplayName = await settingsService.selectedDisplayNameProperty;
      this.setSelectedDisplayNameProperty(prospectiveDisplayName);
    })();
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

  setSelectedDisplayNameProperty = (propertyName) => { 
    (async () => {
      settingsService.selectedDisplayNameProperty = propertyName;
      this.setState({selectedDisplayNameProperty: propertyName});  
    })();
  }

  setPossibleDisplayNameProperties = () => {
    (async () => {
      let displayNameProperties = [];
      try {
        const modelService = new ModelService();
        const models = await modelService.getAllModels();
        const displayNameDict = {};
        models.forEach((model) => {
          model.properties.forEach((propertyObject) => {
            if (propertyObject.schema === STRING_DTDL_TYPE) {
              displayNameDict[propertyObject.name] = displayNameDict[propertyObject.name] ? displayNameDict[propertyObject.name] + 1 : 1;
            }
          });
        });

        // Map dictionary into list of lists segmented by occurence count
        const nameByCount = {};
        Object.keys(displayNameDict).forEach(key => {
          const count = displayNameDict[key];
          if (nameByCount[count]) {
            nameByCount[count].push({ displayName: key, count })
          } else {
            nameByCount[count] = [{ displayName: key, count }];
          }
        })

        // Sort counts in descending order
        const sortedCounts = Object.keys(nameByCount).map(key => Number(key)).sort((a, b) => a - b).reverse();

        // Flatten descending counts, sorted alphabetically within each count, into result array
        displayNameProperties = sortedCounts.map(count =>
          nameByCount[count].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }))
        ).flat();
      } catch (err) {
        console.error(err);
      }

      this.setState({"possibleDisplayNameProperties": displayNameProperties});
    })();
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


  handleModelViewerResizeKewDown = e => {
    if (e.keyCode === LEFT_ARROW_KEY_CODE) {
      this.setState(prevState => ({
        layout: { ...prevState.layout, modelViewerWidth: layoutConfig.minItemWidth + (((this.resizeModelViewerEndX - 1) * 100) / window.innerWidth) }
      }));
      this.resizeModelViewerEndX = this.resizeModelViewerEndX - 1;
    }

    if (e.keyCode === RIGHT_ARROW_KEY_CODE) {
      this.setState(prevState => ({
        layout: { ...prevState.layout, modelViewerWidth: layoutConfig.minItemWidth + (((this.resizeModelViewerEndX + 1) * 100) / window.innerWidth) }
      }));
      this.resizeModelViewerEndX = this.resizeModelViewerEndX + 1;
    }
  }

  handleModelViewerOnFocus = e => {
    e.preventDefault();
    window.addEventListener("keydown", this.handleModelViewerResizeKewDown)
  }

  handleModelViewerBlur = e => {
    e.preventDefault();
    window.removeEventListener("keydown", this.handleModelViewerOnFocus);
  }

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

  handleMainContentPivotChange = itemKey => {
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

  renderClosablePivotItem = item => (
    <div>
      <span>{item.headerText}</span>
      <Icon iconName="ChromeClose" className="close-content-tab" onClick={() => this.hideClosablePivotItem(item)} />
    </div>)

  hideClosablePivotItem = item => {
    if (item.itemKey === "import") {
      this.setState(prevState => ({ layout: { ...prevState.layout, showImport: false, importFile: null } }), () => {
        this.setState({ mainContentSelectedKey: "graph-viewer" });
      });
    }
    if (item.itemKey === "export") {
      this.setState(prevState => ({ layout: { ...prevState.layout, showExport: false } }), () => {
        this.setState({ mainContentSelectedKey: "graph-viewer" });
      });
    }
  }

  render() {
    const { isLoading, layout, mainContentSelectedKey, leftPanelSelectedKey, contrast, selectedDisplayNameProperty, possibleDisplayNameProperties } = this.state;
    const optionalComponentsState = this.optionalComponents.map(p => {
      p.show = layout[p.showProp];
      return p;
    });
    return (
      <>
        <ErrorBoundary FallbackComponent={ErrorPage}>
          <div className="main-grid">
            <div role="banner" className="header" >
              <Stack horizontal className="top-bar">
                <div>
                  <img src={logo} width={20} height={20} alt="" />
                  <h1 className="top-bar-title">Azure Digital Twins Explorer</h1>
                </div>
                <AppCommandBar optionalComponents={optionalComponentsState}
                  optionalComponentsState={optionalComponentsState}
                  toggleOptionalComponent={this.toggleOptionalComponent}
                  toggleHighContrastMode={this.toggleHighContrastMode}
                  contrast={contrast} />
              </Stack>
            </div>
            <Stack className="work-area">
              <ModelUploadMessageBar
                modelUploadResults={this.state.modelUploadResults}
                onDismiss={() => this.setState({ modelUploadResults: null })}
                t={this.props.t}
              />
              <div className="top-area">
                <Text as={"h2"} variant={'small'} className="query-explorer-header" aria-label={this.props.t("app.goldenLayoutConfig.queryComponent")}>{this.props.t("app.goldenLayoutConfig.queryComponent")}</Text>
                <QueryComponent onQueryExecuted={() => this.handleMainContentPivotChange('graph-viewer')}/>
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
                        <ModelViewerComponent
                          showItemMenu={mainContentSelectedKey === "graph-viewer"}
                          onModelUploadSuccess={(modelUploadResults) => this.setState({ modelUploadResults })}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="draggable"
                    tabIndex="0"
                    onMouseDown={this.handleModelViewerResizeMouseDown}
                    onFocus={this.handleModelViewerOnFocus}
                    onBlur={this.handleModelViewerOnBlur}
                    />
                  <div style={{ width: `calc(${100 - layout.modelViewerWidth}% - 3px)`, flex: 1 }}>
                    <Pivot aria-label="Use left and right arrow keys to navigate" selectedKey={mainContentSelectedKey}
                      className="tab-pivot" headersOnly onLinkClick={(item) => this.handleMainContentPivotChange(item.props.itemKey)}>
                      <PivotItem style={{ height: "100%" }} itemKey="graph-viewer" headerText={this.props.t("app.goldenLayoutConfig.graph")} ariaLabel={this.props.t("app.goldenLayoutConfig.graph")} ariaLive="assertive"  />
                      <PivotItem style={{ height: "100%" }} itemKey="model-graph-viewer" headerText={this.props.t("app.goldenLayoutConfig.modelGraphViewer")}  ariaLabel={this.props.t("app.goldenLayoutConfig.modelGraphViewer")} ariaLive="assertive" />
                      {layout.showImport && <PivotItem style={{ height: "100%" }} itemKey="import" headerText={this.props.t("app.importComponentConfig.title")} ariaLabel={this.props.t("app.importComponentConfig.title")} ariaLive="assertive"
                        onRenderItemLink={this.renderClosablePivotItem} />}
                      {layout.showExport && <PivotItem style={{ height: "100%" }} itemKey="export" headerText={this.props.t("app.exportComponentConfig.title")} ariaLabel={this.props.t("app.exportComponentConfig.title")} ariaLive="assertive"
                        onRenderItemLink={this.renderClosablePivotItem} />}
                    </Pivot>
                    <div className="tab-pivot-panel" role="main">
                      <div className={mainContentSelectedKey === "graph-viewer" ? "show" : "hidden"}>
                        <GraphViewerComponent selectedDisplayNameProperty={selectedDisplayNameProperty} displayNameProperties={possibleDisplayNameProperties} setSelectedDisplayNameProperty={this.setSelectedDisplayNameProperty}/>
                      </div>
                      <div className={mainContentSelectedKey === "model-graph-viewer" ? "show" : "hidden"}>
                        <ModelGraphViewerComponent ref={this.modelGraphViewer} />
                      </div>
                      {layout.showImport && <div className={mainContentSelectedKey === "import" ? "show" : "hidden"}>
                        <ImportComponent file={layout.importFile} ref={this.importRef} />
                      </div>}
                      {layout.showExport && <div className={mainContentSelectedKey === "export" ? "show" : "hidden"}>
                        <ExportComponent query={this.state.exportedQuery}/>
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
                    <Pivot aria-label="Use left and right arrow keys to navigate" className="tab-pivot full-height output-console">
                      <PivotItem
                        headerText={this.props.t("app.optionalComponents.output")}>
                        <OutputComponent />
                      </PivotItem>
                    </Pivot>
                  </div>}
                  {layout.showConsole && <div>
                    <Pivot aria-label="Use left and right arrow keys to navigate" className="tab-pivot full-height output-console">
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
