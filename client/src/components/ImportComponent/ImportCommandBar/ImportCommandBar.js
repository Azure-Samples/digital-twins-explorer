// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

class ImportCommandBar extends Component {

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
          ariaLabel={this.props.t("importCommandBar.ariaLabel")} />
      </div>
    );
  }

}

export default withTranslation()(ImportCommandBar);
