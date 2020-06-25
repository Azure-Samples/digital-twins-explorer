// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

import LoaderComponent from "../LoaderComponent/LoaderComponent";

import "./ModalComponent.scss";

const ModalComponent = ({ className, children, isVisible, isLoading }) => (
  isVisible
    ? <div className={`modal-bg ${className} ${isVisible ? "visible" : ""}`}>
      <div className="modal">
        <div className="container">
          {children}
          {isLoading && <LoaderComponent />}
        </div>
      </div>
    </div>
    : null);

export default ModalComponent;
