// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "office-ui-fabric-react";
import { Customizations } from "office-ui-fabric-react/lib/";
import "./i18n";

import App from "./App";
import { darkFabricTheme } from "./theme/DarkFabricTheme";
import "./index.scss";

initializeIcons();
Customizations.applySettings({ theme: darkFabricTheme });

ReactDOM.render(
  <Suspense fallback={<>Loading...</>}>
    <App />
  </Suspense>,
  document.getElementById("root")
);
