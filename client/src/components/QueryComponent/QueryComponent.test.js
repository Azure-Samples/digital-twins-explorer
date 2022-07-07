import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { screen } from "@testing-library/react";
import PubSub from "pubsub-js";
import QueryComponent from "./QueryComponent";
import { configService } from "../../services/ConfigService";
import initIcons from "../../services/IconService/IconService";
import { settingsService } from "../../services/SettingsService";

initIcons();

jest.mock("../../services/ConfigService");
jest.mock("../../services/SettingsService");

const mockQueriesResponse = [ { name: "FloorQuery", query: "SELECT * FROM digitaltwins T where T.$dtId in ['Floor01', 'Floor04']"} ];

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

const inputChange = async (inputName, inputValue) => {
  const input = await screen.findByTestId(inputName);
  input.value = inputValue;
  Simulate.change(input);
};

test("load saved query", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  settingsService.queries = mockQueriesResponse;
  act(() => {
    render(<QueryComponent />, container);
  });

  const savedDropdown = await screen.getByTestId("savedQueryDropdown");

  act(() => {
    savedDropdown.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const dropdownOption = await screen.findByTitle("FloorQuery");

  act(() => {
    dropdownOption.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const queryInput = await screen.getByTestId("queryInput");

  expect(queryInput.value).toBe("SELECT * FROM digitaltwins T where T.$dtId in ['Floor01', 'Floor04']");
});

test("save query", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  settingsService.queries = mockQueriesResponse;
  act(() => {
    render(<QueryComponent />, container);
  });

  const savedDropdown = await screen.getByTestId("savedQueryDropdown");

  act(() => {
    savedDropdown.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  let dropdownOption = await screen.queryAllByTitle("TestQuery");

  expect(dropdownOption.length).toBe(0);

  let saveButton = await screen.getByTestId("saveQueryButton");

  act(() => {
    saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  inputChange("queryNameField", "TestQuery");
  saveButton = await screen.findByTestId("saveQuery");
  act(() => {
    saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  act(() => {
    savedDropdown.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  dropdownOption = await screen.queryAllByTitle("TestQuery");

  expect(dropdownOption.length).toBe(1);
});

test("delete query", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  settingsService.queries = mockQueriesResponse;
  act(() => {
    render(<QueryComponent />, container);
  });

  const savedDropdown = await screen.getByTestId("savedQueryDropdown");

  act(() => {
    savedDropdown.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  let dropdownOption = await screen.queryAllByTitle("Remove query");

  expect(dropdownOption.length).toBe(1);

  act(() => {
    dropdownOption[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const deleteQueryButton = await screen.findByTestId("deleteQueryButton");

  act(() => {
    deleteQueryButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  act(() => {
    savedDropdown.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  dropdownOption = await screen.queryAllByTitle("Remove query");

  expect(dropdownOption.length).toBe(0);
});
