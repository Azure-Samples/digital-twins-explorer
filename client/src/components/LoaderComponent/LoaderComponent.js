// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Link } from "office-ui-fabric-react";

import "./LoaderComponent.scss";

const LoaderComponent = props => {
  const { message, cancel } = props;
  return (
    <div className="app-loader">
      <div className="content">
        <div className="loader" />
        {message && <div className="status">{message}</div>}
        <div className="cancel">
          {cancel && <Link onClick={cancel}>Cancel</Link>}
        </div>
      </div>
    </div>
  );
};

export default LoaderComponent;
