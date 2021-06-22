// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "office-ui-fabric-react";
import "./i18n";

import App from "./App";
import "./index.scss";

initializeIcons();

ReactDOM.render(
  <Suspense fallback={<>Loading...</>}>
    <App />
  </Suspense>,
  document.getElementById("root")
);
