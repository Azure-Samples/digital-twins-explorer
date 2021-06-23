// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import "./i18n";
import initIcons from "./services/IconService/IconService";

import App from "./App";
import "./index.scss";

initIcons();

ReactDOM.render(
  <Suspense fallback={<>Loading...</>}>
    <App />
  </Suspense>,
  document.getElementById("root")
);
