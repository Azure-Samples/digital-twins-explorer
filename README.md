---
page_type: sample
languages:
- javascript
- typescript
products:
- azure-digital-twins
name: Azure Digital Twins explorer
description: A code sample for visualizing and managing an Azure Digital Twins instance
urlFragment: digital-twins-explorer
---

# Azure Digital Twins Explorer

**Azure Digital Twins Explorer** is a developer tool for the [Azure Digital Twins service](https://docs.microsoft.com/azure/digital-twins/overview). It lets you connect to an Azure Digital Twins instance to understand, visualize and modify your digital twin data.

<img src="https://raw.githubusercontent.com/Azure-Samples/digital-twins-explorer/main/media/digital-twins-explorer.png" alt="Image of digital-twins-explorer"/>

Azure Digital Twins Explorer is written as a single-page JavaScript application. This repository holds the code for the hosted version of Azure Digital Twins Explorer, which is accessible through the [Azure portal](https://portal.azure.com) and at [explorer.digitaltwins.azure.net](https://explorer.digitaltwins.azure.net). You can also run the application locally as a node.js application.

This README contains information and guidance specific to hosting this codebase locally, including:
* [Instructions to run the sample locally](#run-azure-digital-twins-explorer-locally)
* [Instructions to run the sample as a Docker application](#run-azure-digital-twins-explorer-with-docker)
* [Sign in information for the first run of the sample](#sign-in-on-first-run)
* [Experimental features](#experimental-features)
* [Extensibility points](#extensibility-points)
* [Services](#services)

For general documentation on the Azure Digital Twins Explorer features for both the hosted version and local codebase, see the [Azure Digital Twins documentation](https://docs.microsoft.com/azure/digital-twins/overview): 
* [Concepts: Azure Digital Twins Explorer](https://docs.microsoft.com/azure/digital-twins/concepts-azure-digital-twins-explorer)
* [How-to: Use Azure Digital Twins Explorer](https://docs.microsoft.com/azure/digital-twins/how-to-use-azure-digital-twins-explorer)



Azure Digital Twins Explorer is licensed under the MIT license. Please see the Microsoft [Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct)

## Requirements

Node.js 10+

## Run Azure Digital Twins Explorer locally

1. Set up an Azure Digital Twins service instance and give yourself  permissions (e.g. *Azure Digital Twins Owner*). For instructions, please see the following how-to article:
    * [Set up an Azure Digital Twins instance and authentication](https://docs.microsoft.com/azure/digital-twins/how-to-set-up-instance-portal)
1. When running locally, Azure Digital Twins Explorer will use Azure default credentials. In order to authenticate, you can run, for example, **az login** in any command prompt. When you later run Azure Digital Twins Explorer, it will pick up the credentials. Alternatively, you can sign into Visual Studio Code.
1. Select the **Download ZIP** button to download a .zip file of this sample code to your machine. Unzip the **digital-twins-explorer-<branch>.zip** folder, and extract the files. Alternatively, you can clone the repository.
1. From a command prompt in the `client/src` folder, run `npm install`. This will retrieve all dependencies
    >**IMPORTANT!** Due to a dependency on the `npm-force-resolutions` package to mitigate an underlying security issue you will not be able to install under any path that contains a space. For more information, see this GitHub [issue](https://github.com/rogeriochaves/npm-force-resolutions/issues/17).
1. From the same command prompt, run `npm run start`.
    > By default, the app runs on port 3000. To customize the port, change the run command. For example, to use port 8080:
    >  * Linux/Mac (Bash): `PORT=8080 npm run start`
    >  * Windows (cmd): `set PORT=8080 && npm run start`
    > Note: Your Azure Digital Twins app registration must have a reply URL using the same port you are using - e.g. localhost:7000 if that is the port you are using.
1. Your browser should open and the app should appear.

See below for instructions on how to run digital-twins-explorer using docker.

## Run Azure Digital Twins Explorer with Docker

1. From a command prompt in the root folder, run `docker build -t azure-digital-twins-explorer .`. This will build the Docker image for the Azure Digital Twins Explorer.
1. From the same command prompt, run `docker run -it -p3000:3000 azure-digital-twins-explorer`.
    > By default, the app runs on port 3000. To customize the port, change the run command. For example, to use port 8080 run `docker run -it -p8080:3000 azure-digital-twins-explorer`.
    > A message will appear on the console asking you to login using a code in the Microsoft device login page with your web browser; after doing so the Azure Digital Twins Explorer should start.
    >  * Note: When run successfully the application will display a message showing you the URL & port that you must open to browse the app. When running the app inside Docker this information might not be accurate, as other port might have been exposed. Be sure to use
    >  the port you chose before.
1. You can now open your web browser and browse to `http://localhost:3000` (change `3000` for the appropriate port, if you changed it).

## Sign in on first run

Initial authentication is triggered by either of the following actions:
1. Clicking on the Azure Digital Twins URL button in the top right
 
    <img src="https://raw.githubusercontent.com/Azure-Samples/digital-twins-explorer/main/media/digital-twins-explorer-url.png" alt="sign-in icon" width="250"/>
1. Clicking on an operation that requires calling the service. When you click the first command, Azure Digital Twins Explorer will open a dialog that prompts you for connection information to your service instance.

To continue, you will need to provide the URL of the Azure Digital Twins instance you want to access, in the form of the instance's **host name** prefixed with "https://". You can find the instance's host name in the [Azure portal](https://portal.azure.com) overview page for your Azure Digital Twins instance.

<img src="https://raw.githubusercontent.com/Azure-Samples/digital-twins-explorer/main/media/sign-in-dialog.png" alt="sign-in dialog" width="250"/>

To change the instance URL to connect to another instance of Azure Digital Twins, click on the sign in button in the top right.
 
## Experimental features

In addition to local operation, you can also run Azure Digital Twins Explorer as a cloud application. In the cloud, you can use push notifications from Azure Digital Twins, sent via the Azure SignalR service, to update your digital-twins-explorer in real time.

### Running in the cloud

1. Deploy the ARM template called `template.json` located under the `deployment` folder into your Azure subscription.
1. Package the client app using `npm run build`. You may need to set `NODE_OPTIONS=--max_old_space_size=4096` if you receive memory-related errors.
1. From the new `build` file, upload each file to the `web` container in the new storage account created by the ARM template.
1. Package the functions app using `dotnet publish -c Release -o ./publish`.
1. Zip the contents of the `./publish` folder. E.g. from within the publish folder, run `zip -r DigitalTwinsExplorerFunctions.zip *`.
1. Publish the functions app using the CLI: `az functionapp deployment source config-zip -g <resource_group> -n <app_name> --src <zip_file_path>`.
1. [Optional] For each Azure Digital Twins environment used with the tool *where live telemetry through SignalR is required*, deploy the `template-eventgrid.json` template in your Azure subscription.
1. Setup a system assigned identity to allow Functions proxy to access Azure Digital Twins Service.
    1. In Azure, open the **Function App** resource from your resource group.
    1. Click **Identity** from the left hand blade.
    1. Under the **System assigned** tab Turn the **Status** toggle to on.
    1. From your resource group, select the **Azure Digital Twins** resource.
    1. Click **Access Control (IAM)** from the left blade.
    1. Click **+ Add** then **Add role assignment**.
    1. Select **Azure Digital Twins Data Owner** as the Role.
    1. Assign access to **System assigned managed identity - Functions App**.
    1. Select your **Functions App** from the list.
    1. Click **Save**.

### Advanced

When running locally, the Event Grid and SignalR services required for telemetry streaming are not available. However, if you have completed the cloud deployment, you can leverage these services locally to enable the full set of capabilities.

This requires setting the `REACT_APP_BASE_ADT_URL` environment variable to point to your Azure Functions host (e.g. `https://adtexplorer-<your suffix>.azurewebsites.net`). This can be set in the shell environment before starting `npm` or by creating a `.env` file in the `client` folder with `REACT_APP_BASE_ADT_URL=https://...`.

Also, the local URL needs to be added to the allowed origins for the Azure Function and SignalR service. In the ARM template, the default `http://localhost:3000` path is added during deployment; however, if the site is run on a different port locally then both services will need to be updated through the Azure Portal.

## Extensibility points

### Import

Import plugins are found in `src/services/plugins` directory within the client code base. Each plugin should be defined as a class with a single function:

```ts
tryLoad(file: File): Promise<ImportModel | boolean>
```

If the plugin can import the file, it should return an `ImportModel`. If it cannot import the file, it should return `false` so the import service can share the file with other plugins.

The `ImportModel` should be structured as follows:

```ts
class DataModel {
  digitalTwinsFileInfo: DataFileInfoModel;
  digitalTwinsGraph: DataGraphModel;
  digitalTwinsModels: DigitalTwinModel[];
}

class DataFileInfoModel {
  fileVersion: string; // should be "1.0.0"
}

class DataGraphModel {
  digitalTwins: DigitalTwin[]; // objects align with structure returned by API
  relationships: DigitalTwinRelationship[]; // objects align with structure returned by API
}
```

New plugins need to be registered in `ImportPlugins` collection at the top of the `src/services/ImportService.js` file.

Currently, import plugins for Excel and JSON are provided. To support custom formats of either, the new plugins would need to be placed first in the `ImportPlugins` collection or they would need to be extended to detect the custom format (and either parse in place or return `false` to allow another plugin to parse).

The `ExcelImportPlugin` is designed to support additional Excel-based formats. Currently, all files are parsed through the `StandardExcelImportFormat` class; however, it would be relatively straightforward to inspect cell content to detect specific structures and call an alternative import class instead.

### Export

Graphs can be exported as JSON files (which can then be re-imported). The structured of the files follows the `DataModel` class described in the previous section.

Export is managed by the `ExportService` class in `src/services/ExportService.js` file.

To alter the export format structure, the existing logic within the `ExportService` to extract the contents of the graph could be reused and then re-formatted as desired.

### Views

All panels are defined in the `src/App.js` file. These configuration objects are defined by the requirements of the Golden Layout Component.

For temporary panels within the application (e.g. import preview), two approaches can be considered:
1. For panels like output & console, the new panel can be added to the `optionalComponentsConfig` collection. This allows the panel's state (i.e. open or closed) to be managed through the app state, regardless of whether it is closed via the 'X' on the tab or when it is closed via configuration (like available in the preferences dialog).
1. For panels like import preview, these can be manually added on demand to the layout. This can be cleanly done via the pub/sub mechanism (see below and the `componentDidMount` method in `App.js`).

### View commands

Where a view has commands, it's suggested that a dedicated command bar component is created (based on components like that found in `src/components/GraphViewerComponent/GraphViewerCommandBarComponent.js`). These leverage the Office Fabric UI `CommandBar` component and either expose callbacks for functionality via props or manage operations directly.

### Pub/Sub

The Golden Layout Component includes a pub/sub message bus for communication between components. This is key part of the Azure Digital Twins Explorer and is used to pass messages between components.

All events - via publish and subscribe methods - are defined in the `src/services/EventService.js` file. Additional events can be defined by adding to this file.

The pub/sub message bus is not immediately available on application load; however, the event service will buffer any pub or sub requests during this period and then apply them once available.

## Services

### Local

When running locally, all requests to the Azure Digital Twins service are proxied through the same local web server used for hosting the client app. This is configured in the `client/src/setupProxy.js` file.

### Cloud

When running in the cloud, Azure Functions hosts three services to support the front end application:
1. Proxy: this proxies requests through the Azure Digital Twins service (much in the same way as the proxy used when running locally).
1. SignalR: this allows clients to retrieve credentials to access the SignalR service for live telemetry updates. It also validates that the endpoint and route required to stream information from the Azure Digital Twins service to the Azure Digital Twins Explorer app is in place. If the managed service identity for the Function is configured correctly (i.e. has write permissions on the resource group and can administer the Azure Digital Twins service), then it can create these itself.
1. EventGrid: this receives messages from the Event Grid to broadcasts them to any listening clients using SignalR. The messages are sent from Azure Digital Twins to the function via Azure Digital Twins endpoint and route.

> NOTE: If you have hosting the application somewhere other than Azure Functions. Then we recommend you add the Content Security Policy to you environment as defined in the `proxies.json` file.
