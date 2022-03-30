// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const REL_TYPE_OUTGOING = "outgoing";
export const REL_TYPE_INCOMING = "incoming";
export const REL_TYPE_ALL = "all";
export const CUSTOM_AUTH_ERROR_MESSAGE
  = `Authentication failed. If you are running the app locally, please make sure that you are logged in to Azure on your host machine, 
  for example by running ‘az login’ in a command prompt, by signing into Visual Studio or VS Code or by setting environment variables. 
  If you need more information, please see the readme, or look up DefaultAzureCredential in the Azure.Identity documentation. 
  If you are running digital-twins-explorer hosted in the cloud, please make sure that your hosting Azure Function has a system-assigned managed identity set up. 
  See the readme for more information.`;
export const CUSTOM_NOT_FOUND_ERROR_MESSAGE
  = `Twin not found. Check that you have spelled the name correctly and are logged in with a subscription that has access to the instance.`;
export const CUSTOM_AZURE_ERROR_MESSAGE
  = `This feature is not yet available in Azure. Please manually configure a system-assigned managed identity for your Azure Function.`;
export const AUTH_SUCCESS_MESSAGE = "Success! Reload the page to load your new credentials. It may take several seconds for changes to propagate.";
export const AUTH_CONFLICT_MESSAGE = "Role already exists. Restart the app to reload your credentials.";
export const AUTH_FORBIDDEN_MESSAGE = "Forbidden. You do not have permission to changes roles on this twin instance";
export const AUTH_NOT_FOUND_MESSAGE = "Twin not found";
export const TWIN_DATA_OWNER_RBAC_ID = "bcd981a7-7f74-457b-83e1-cceb9e632ffe";
export const MORE_INFORMATION_LINK = "https://docs.microsoft.com/en-us/azure/digital-twins/";
export const DETAIL_MIN_WIDTH = 24;
export const PROPERTY_INSPECTOR_DEFAULT_WIDTH = 35;
export const STRING_DTDL_TYPE = "dtmi:dtdl:instance:Schema:string;2";
export const DEFAULT_DISPLAY_NAME_PROPERTY = "$dtId";
export const API_VERSION = "2021-06-30-preview";
