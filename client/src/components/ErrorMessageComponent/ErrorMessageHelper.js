// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const isDtdlVersion3 = exc =>
  (exc?.name === "DocumentParseError" && exc?.innerError?.details?.url === "dtmi:dtdl:context;3")
  || exc?.message === "Invalid context. context is undefined";
