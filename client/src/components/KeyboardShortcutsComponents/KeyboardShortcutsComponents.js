// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, Icon } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";

import "./KeyboardShortcutsComponents.scss";

const CommandIconStyle = { color: "white" };

export class KeyboardShortcutsComponents extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  resetModalState = () => {
    this.setState({
      showModal: false
    });
  };

  open = () => {
    this.setState({ showModal: true });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  render() {
    const { showModal } = this.state;

    return (
      <ModalComponent isVisible={showModal} className="keyboard-shortcuts">
        <div style={{ width: 650, height: 400 }}>
          <h2 className="heading-2"><Icon className="main-icon" iconName="keyboardClassic" />{this.props.t("appCommandBar.keyboardShortcuts.text")}</h2>
          <div>
            <div className="keys">
              <span className="key square">
                <Icon iconName="CaretSolidLeft" style={CommandIconStyle} />
              </span>
              <span className="key square">
                <Icon iconName="CaretSolidUp" style={CommandIconStyle} />
              </span>
              <span className="key square">
                <Icon iconName="CaretSolidRight" style={CommandIconStyle} />
              </span>
              <span className="key square">
                <Icon iconName="CaretSolidDown" style={CommandIconStyle} />
              </span>
              <span className="operator">=</span>
              <span> {this.props.t("appCommandBar.keyboardShortcuts.navigateWithin")}</span>
            </div>
            <div className="keys">
              <span className="key text">Tab</span>
              <span className="operator">=</span>
              <span>{this.props.t("appCommandBar.keyboardShortcuts.navigateTo")}</span>
            </div>
            <div className="keys">
              <span className="key text">Enter</span>
              <span className="operator">=</span>
              <span>{this.props.t("appCommandBar.keyboardShortcuts.select")}</span>
            </div>
            <div className="keys">
              <span className="key text">Ctrl</span>
              <span className="operator">+</span>
              <span className="key text">Enter</span>
              <span className="operator">=</span>
              <span>{this.props.t("appCommandBar.keyboardShortcuts.selectMultiple")}</span>
            </div>
            <div className="keys">
              <span className="key text">Ctrl</span>
              <span className="operator">+</span>
              <span className="key square">]</span>
              <span className="operator">=</span>
              <span>{this.props.t("appCommandBar.keyboardShortcuts.deselectAll")}</span>
            </div>
            <div className="keys">
              <span className="key text">Space</span>
              <span className="operator">=</span>
              <span>{this.props.t("appCommandBar.keyboardShortcuts.contextMenu")}</span>
            </div>
          </div>
          <div className="btn-group">
            <DefaultButton
              className="modal-button close-button"
              onClick={this.close}>
              {this.props.t("appCommandBar.keyboardShortcuts.closeButton")}
            </DefaultButton>
          </div>
        </div>
      </ModalComponent>
    );
  }

}
