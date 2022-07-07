import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { findByText, findByLabelText, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PubSub from "pubsub-js";
import ModelViewerComponent from "./ModelViewerComponent";
import { apiService } from "../../services/ApiService";
import { configService } from "../../services/ConfigService";
import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";
import { ModelService } from "../../services/ModelService";
import initIcons from "../../services/IconService/IconService";

initIcons();


jest.mock("../../services/ApiService");
jest.mock("../../services/ConfigService");
jest.mock("../../services/ModelService");
jest.mock("../../services/EventService");
jest.mock("../../services/SettingsService");

const retrieveModels = jest.spyOn(apiService, "queryModels");
const deleteModel = jest.spyOn(apiService, "deleteModel");
const uploadModel = jest.spyOn(apiService, "addModels");
const getModel = jest.spyOn(apiService, "getModelById");
const getModelImage = jest.spyOn(settingsService, "getModelImage");
const deleteImage = jest.spyOn(settingsService, "deleteModelImage");

const models = [
  {
    "displayName": {
      "en": "Floor"
    },
    "description": {},
    "id": "dtmi:com:example:adtexplorer:Floor;1",
    "uploadTime": "2022-02-10T19:57:28.372Z",
    "decommissioned": false,
    "model": {
      "@id": "dtmi:com:example:adtexplorer:Floor;1",
      "@type": "Interface",
      "@context": [
        "dtmi:dtdl:context;2"
      ],
      "displayName": "Floor",
      "contents": [
        {
          "@type": "Relationship",
          "name": "contains",
          "target": "dtmi:com:example:adtexplorer:Room;1"
        },
        {
          "@type": "Property",
          "name": "AverageTemperature",
          "schema": "double",
          "writable": true
        }
      ]
    }
  }
];

const mockGetModelImage = "\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARwAAACxCAMAAAAh3/JWAAABiVBMVEWAgIAAAAD////AwAB9fX2epllnWahYpo6mWXkAwL++AAIAvwC/v796enpajqalcVm/AL8AAb6wsLCZmZlmZmaNjY1zc3Ourq7MzMwzMzOkpKSFhYWRkZFfX1+goKCPjwBWVlZkVapHR0eTkZmYmZHd3d0NDQ0dHR3a2tp8r566vpvJycmvfZF7gH6hm79QUFAqKiphpZuEaZePo30AwMju7u6raHdSB5+oclOjsbiGm6e3qaOfk46kvksIvV68CJQBz86njoTNAQPX13/PzwEADxABzgHOAc4PDwB6eogAABABA82YoUsEnJt0uHS4dLiBk42RjqBjwL8EmwRkwGSbBpu/Y7+/Y2OaBAWdnQRgYL+Ghnq+vmAGBpufn1m2tieQkG3Q0JSlpUOYmGOwsDu7uxiZrrm3w8ofBAVeV..."; //eslint-disable-line

const mockSuccessResponse = { "Status": "Success" };

const uploadValue = [
  {
    "@id": "dtmi:com:example:adtexplorer:FloorNew;1",
    "@type": "Interface",
    "displayName": "Floor",
    "contents": [
      {
        "@type": "Property",
        "name": "AverageTemperature",
        "schema": "double",
        "writable": true
      }
    ],
    "@context": "dtmi:dtdl:context;2"
  }
];

const modelData = {
  "model": {
    "@id": "dtmi:com:example:adtexplorer:Floor;1",
    "@type": "Interface",
    "displayName": "Floor",
    "contents": [
      {
        "@type": "Relationship",
        "name": "contains",
        "target": "dtmi:com:example:adtexplorer:Room;1"
      },
      {
        "@type": "Property",
        "name": "AverageTemperature",
        "schema": "double",
        "writable": true
      }
    ],
    "@context": [
      "dtmi:dtdl:context;2"
    ]
  }
};


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

test("renders model List", async () => {
  // The <ModelViewerComponent /> component calls the config service and won't call the API unless the appAdtUrl is set
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const nodeList = container.querySelectorAll(".mv_listItem");
  expect(nodeList.length).toBe(1);
  expect(retrieveModels).toHaveBeenCalledTimes(1);
});

test("renders model Information", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  apiService.getModelById.mockResolvedValue(modelData);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = container.querySelector(".ms-CommandBar-overflowButton");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const options = await screen.findByLabelText("modelViewerItemCommandBarComponent.farItems.viewModel");
  expect(getModel).toHaveBeenCalledTimes(0);
  act(() => {
    options.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await screen.findByText("modelViewerViewComponent.defaultButton");
  expect(getModel).toHaveBeenCalledTimes(1);
});

test("delete model", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = container.querySelector(".ms-CommandBar-overflowButton");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const options = await screen.findByLabelText("modelViewerItemCommandBarComponent.farItems.deleteModels");
  act(() => {
    options.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const confirm = await screen.getByTestId("confirm");
  act(() => {
    confirm.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(deleteModel).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(eventService.publishDeleteModel).toHaveBeenCalledTimes(1));
});

test("create a twin", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  apiService.addTwin.mockResolvedValue(mockSuccessResponse);
  ModelService.prototype.createPayload.mockResolvedValue(mockSuccessResponse);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = container.querySelector(".ms-CommandBar-overflowButton");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const options = await screen.findByLabelText("modelViewerItemCommandBarComponent.farItems.createTwin");
  act(() => {
    options.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  inputChange("twinNameInput", "TestTwin");
  const saveButton = await screen.findByTestId("saveTwin");
  act(() => {
    saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await waitFor(() => {
    expect(apiService.addTwin).toHaveBeenCalledTimes(1);
  });
});

test("delete all models", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  ModelService.prototype.deleteAll.mockResolvedValue(mockSuccessResponse);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = await findByLabelText(container, "modelViewerCommandBarComponent.farItems.deleteModels.ariaLabel");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await findByText(container, "Are you sure?");
  const deleteButton = container.querySelector(".save-button");
  act(() => {
    deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(ModelService.prototype.deleteAll.mock.calls.length).toBe(1);
});

test("upload model", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  apiService.addModels.mockResolvedValue(mockSuccessResponse);
  ModelService.prototype.getModelIdsForUpload.mockResolvedValue([ "dtmi:com:example:adtexplorer:FloorNew;1" ]);
  ModelService.prototype.chunkModelsList.mockReturnValue([ [ "dtmi:com:example:adtexplorer:FloorNew;1" ] ]);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = await findByLabelText(container, "modelViewerCommandBarComponent.farItems.uploadModel.text");
  expect(uploadModel).toHaveBeenCalledTimes(0);
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const str = JSON.stringify(uploadValue);
  const blob = new Blob([ str ]);
  const file = new File([ blob ], "values.json", {
    type: "application/json"
  });
  File.prototype.text = jest.fn().mockResolvedValueOnce(str);
  const input = container.querySelectorAll(".mv-fileInput");
  userEvent.upload(input[0], file);
  await waitFor(() => {
    expect(uploadModel).toHaveBeenCalledTimes(1);
  });
});


test("upload model image", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  settingsService.setModelImage.mockResolvedValue(mockSuccessResponse);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  const button = container.querySelector(".ms-CommandBar-overflowButton");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const options = await screen.findByLabelText("modelViewerItemCommandBarComponent.farItems.uploadModel");
  act(() => {
    options.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const blob = new Blob([ mockGetModelImage ]);
  const file = new File([ blob ], "Floor.png", {
    type: "image/png"
  });
  File.prototype.text = jest.fn().mockResolvedValueOnce(mockGetModelImage);
  const input = container.querySelectorAll(".mv-fileInput");
  userEvent.upload(input[0], file);
  expect(retrieveModels).toHaveBeenCalledTimes(2);
});

test("delete model image", async () => {
  configService.getConfig.mockResolvedValue({ appAdtUrl: "https://foo" });
  apiService.queryModels.mockResolvedValue(models);
  settingsService.getModelImage.mockResolvedValue(mockGetModelImage);
  settingsService.deleteModelImage.mockResolvedValue(mockSuccessResponse);
  act(() => {
    render(<ModelViewerComponent showItemMenu="true" />, container);
  });

  await findByText(container, "Floor");
  expect(getModelImage).toHaveBeenCalledTimes(1);
  const button = container.querySelector(".ms-CommandBar-overflowButton");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const options = await screen.findByLabelText("modelViewerItemCommandBarComponent.farItems.uploadModel");
  act(() => {
    options.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const deleteButton = await screen.getByTestId("deleteModelImage");
  act(() => {
    deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(deleteImage).toHaveBeenCalledTimes(1);
});
