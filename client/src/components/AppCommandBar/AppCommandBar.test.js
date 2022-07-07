import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { screen } from "@testing-library/react";
import PubSub from "pubsub-js";
import AppCommandBar from "./AppCommandBar";

import { configService } from "../../services/ConfigService";
import { apiService } from "../../services/ApiService";

import initIcons from "../../services/IconService/IconService";

initIcons();

jest.mock("../../services/ConfigService");
jest.mock("../../services/ApiService");
jest.mock("../../services/EventService");

const getAllTwins = jest.spyOn(apiService, "getAllTwins");

const optionalComponentsState = [ {
  id: "console",
  name: "Console",
  show: false,
  showProp: "showConsole"
}, {
  id: "output",
  name: "Output",
  show: false,
  showProp: "showOutput"
} ];

let container = null;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  PubSub.clearAllSubscriptions();
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});


test("delete all twins component", async () => {
  // The <ModelViewerComponent /> component calls the config service and won't call the API unless the appAdtUrl is set
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });

  act(() => {
    render(<AppCommandBar optionalComponentsState={optionalComponentsState} />, container);
  });

  const button = container.querySelector(".delete-button");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const deleteButton = await screen.findByTestId("deleteTwins");

  act(() => {
    deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(getAllTwins).toHaveBeenCalledTimes(1);
});

test("switch console", async () => {
  // The <ModelViewerComponent /> component calls the config service and won't call the API unless the appAdtUrl is set
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });

  let toggleCounter = 0;

  const toggleOptionalComponent = id => {
    expect(id).toBe("console");
    toggleCounter++;
  };

  act(() => {
    render(<AppCommandBar optionalComponentsState={optionalComponentsState}
      toggleOptionalComponent={toggleOptionalComponent} />, container);
  });

  const button = container.querySelector(".settings-button");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const consoleButton = await screen.findByTestId("showConsoleField");

  act(() => {
    consoleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(toggleCounter).toBe(1);

  act(() => {
    consoleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(toggleCounter).toBe(2);
});


test("switch output", async () => {
  // The <ModelViewerComponent /> component calls the config service and won't call the API unless the appAdtUrl is set
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });

  let toggleCounter = 0;

  const toggleOptionalComponent = id => {
    expect(id).toBe("output");
    toggleCounter++;
  };

  act(() => {
    render(<AppCommandBar optionalComponentsState={optionalComponentsState}
      toggleOptionalComponent={toggleOptionalComponent} />, container);
  });

  const button = container.querySelector(".settings-button");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const consoleButton = await screen.findByTestId("showOutputField");

  act(() => {
    consoleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(toggleCounter).toBe(1);

  act(() => {
    consoleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(toggleCounter).toBe(2);
});
