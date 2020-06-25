// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "office-ui-fabric-react";
import { Customizations } from "office-ui-fabric-react/lib/";

import App from "./App";
import { darkFabricTheme } from "./theme/DarkFabricTheme";
import "./index.scss";

initializeIcons();
Customizations.applySettings({ theme: darkFabricTheme });

ReactDOM.render(<App />, document.getElementById("root"));
