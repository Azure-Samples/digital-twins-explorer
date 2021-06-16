// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import { Customizations } from "office-ui-fabric-react/lib/";
import initIcons from "./services/IconService/IconService";

import App from "./App";
import { darkFabricTheme } from "./theme/DarkFabricTheme";
import "./index.scss";

initIcons();
Customizations.applySettings({ theme: darkFabricTheme });

ReactDOM.render(<App />, document.getElementById("root"));
