// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";

export class ImportCommandBar extends Component {

  farItems = [
    {
      key: "startImport",
      text: "Start Import",
      iconProps: { iconName: "Save" },
      onClick: () => this.props.onSaveClicked(),
      iconOnly: true,
      className: "iv-toolbarButtons"
    }
  ]

  render() {
    const { isSaveEnabled } = this.props;
    this.farItems[0].disabled = !isSaveEnabled;

    return (
      <div>
        <CommandBar
          farItems={this.farItems}
          ariaLabel="Use left and right arrow keys to navigate between commands" />
      </div>
    );
  }

}
