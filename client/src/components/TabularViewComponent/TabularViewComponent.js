// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DetailsList, SelectionMode } from "office-ui-fabric-react";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { withTranslation } from "react-i18next";

import "./TabularViewComponent.scss";

export class TabularViewComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      items: this.generateItems()
    };
    this.columns = [
      {
        key: "idColumn",
        fieldName: "id",
        name: "Relationship ID",
        data: props.t("app.tabularViewComponentConfig.relationshipID"),
        minWidth: 250,
        maxWidth: 250,
        isPadded: true
      }, {
        key: "nameColumn",
        fieldName: "name",
        name: props.t("app.tabularViewComponentConfig.name"),
        data: "string",
        minWidth: 200,
        maxWidth: 200,
        isPadded: true
      }, {
        key: "sourceColumn",
        fieldName: "source",
        name: props.t("app.tabularViewComponentConfig.source"),
        data: "string",
        minWidth: 200,
        maxWidth: 200,
        isPadded: true
      }, {
        key: "targetColumn",
        fieldName: "target",
        name: props.t("app.tabularViewComponentConfig.target"),
        data: "string",
        minWidth: 200,
        maxWidth: 200,
        isPadded: true
      }
    ];
  }

  componentDidMount = () => {
    this.setState({ isLoading: false });
  }

  generateItems = () => {
    const items = this.props.relationships
      ? this.props.relationships.map(element => {
        const item = {
          name: element.$relationshipName,
          source: element.$sourceId,
          target: element.$targetId,
          id: element.$relationshipId
        };
        return item;
      })
      : [];
    return items;
  }

  render() {
    const { isLoading, items } = this.state;
    return (
      <div className="ev-grid tabular-view">
        <DetailsList
          items={items}
          columns={this.columns}
          isHeaderVisible
          selectionMode={SelectionMode.none}
          width="70%" />
        {isLoading && <LoaderComponent />}
      </div>
    );
  }

}

export default withTranslation("translation", { withRef: true })(TabularViewComponent);
