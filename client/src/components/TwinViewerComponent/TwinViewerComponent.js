// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { TextField } from "office-ui-fabric-react";

import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { TwinViewerItem } from "./TwinViewerItem/TwinViewerItem";
import { eventService } from "../../services/EventService";

import "./TwinViewerComponent.scss";

export class TwinViewerComponent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      items: [],
      relationships: [],
      filterText: "",
      isLoading: false
    };

    this.originalItems = [];
    this.uploadModelRef = React.createRef();
    this.uploadModelFolderRef = React.createRef();
    this.uploadModelImagesRef = React.createRef();
    this.createRef = React.createRef();
    this.viewRef = React.createRef();
    this.deleteRef = React.createRef();
    this.selectRef = React.createRef();
    this.updateModelImageRef = React.createRef();
    this.inputFileRef = null;
    this.spaceEventTarget = null;
    this.canClearAll = true;
  }

  componentDidMount() {
    eventService.subscribeGraphTwins(twins => {
      this.originalItems = twins;
      this.setState(prevState => ({ items: this.filterOriginalItems(prevState.filterText) }));
    });
    eventService.subscribeGraphRelationships(relationships => {
      this.setState({ relationships });
    });
    eventService.subscribeSelectedTwins(twins => {
      if (twins && twins.length > 0) {
        const twinIds = twins.map(twin => twin.id);
        this.setState(prevState => ({
          items: prevState.items.map(i => ({
            ...i,
            selected: twinIds.includes(i.$dtId)
          }))
        }));
      } else if (twins.length === 0) {
        this.setState(prevState => ({
          items: prevState.items.map(i => ({
            ...i,
            selected: false
          }))
        }));
      }
    });
    eventService.subscribeFocusTwinViewer(() => {
      if (this.spaceEventTarget) {
        this.spaceEventTarget.focus();
        this.spaceEventTarget = null;
      }
    });
    eventService.subscribeClearGraphSelection(this.onDeselectAll);
  }

  onFilterChanged = (_, text) => {
    this.setState({
      filterText: text,
      items: this.filterOriginalItems(text)
    });
  }

  filterOriginalItems = text => text ? this.originalItems.filter(item => item.$dtId.toLowerCase().indexOf(text.toLowerCase()) >= 0) : this.originalItems;

  onView = item => this.viewRef.current.open(item)

  onCreate = item => this.createRef.current.open(item)

  onDelete = item => this.deleteRef.current.open(item)

  onSelect = (clickedItem, addToSelected) => {
    const { items } = this.state;
    const currentSelectedItems = [];
    const updatedItems = items.map(item => {
      if (addToSelected) {
        item.selected = item.$dtId === clickedItem.$dtId ? !clickedItem.selected : item.selected;
      } else {
        item.selected = item.$dtId === clickedItem.$dtId ? !clickedItem.selected : false;
      }
      if (item.selected) {
        currentSelectedItems.push(item);
      }
      return item;
    });
    this.setState({ items: updatedItems });
    if (!addToSelected) {
      this.canClearAll = false;
      eventService.publishClearGraphSelection();
    }

    if (currentSelectedItems.length === 1) {
      const item = { ...currentSelectedItems[0] };
      delete item.selected;
      eventService.publishSelection({ selection: item, selectionType: "twin" });
    }

    eventService.publishSelectTwins(currentSelectedItems.map(i => i.$dtId));
  }

  onSelectRelationship = clickedRel => {
    eventService.publishClickRelationship(clickedRel);
  }

  onSpaceRelationship = (e, rel) => {
    this.spaceEventTarget = e.target;
    eventService.publishRelationshipContextMenu(rel);
  }

  onSpace = (e, item) => {
    this.spaceEventTarget = e.target;
    eventService.publishTwinContextMenu(item);
  }

  onFocus = item => {
    eventService.publishFocusTwin(item);
  }

  onBlur = item => eventService.publishBlurTwin(item);

  onDeselectAll = () => {
    if (this.canClearAll) {
      const { items } = this.state;
      const updatedItems = items.map(item => {
        delete item.selected;
        return item;
      });
      this.setState({ items: updatedItems });
    } else {
      this.canClearAll = true;
    }
  }

  render() {
    const { items, relationships, isLoading, filterText } = this.state;
    return (
      <div className="tv-grid">
        <div>
          <TextField className="tv-filter" onChange={this.onFilterChanged} styles={this.getStyles}
            placeholder="Search" value={filterText} aria-live="assertive" aria-label="NO results found" />
        </div>
        <div data-is-scrollable="true" className="tv-modelListWrapper">
          {items.map((item, index) => {
            const itemRelationships = relationships.filter(r => r.$sourceId === item.$dtId || r.$targetId === item.$dtId);
            return (
              <TwinViewerItem key={item.$dtId} item={item}
                relationships={itemRelationships}
                itemIndex={index} isSelected={item.selected}
                onSelect={this.onSelect}
                onSelectRelationship={this.onSelectRelationship}
                onSpace={e => this.onSpace(e, item)}
                onSpaceRelationship={this.onSpaceRelationship}
                onFocus={() => this.onFocus(item)}
                onBlur={() => this.onBlur(item)}
                onDeselectAll={this.onDeselectAll} />
            );
          })}
        </div>
        {isLoading && <LoaderComponent />}
      </div>
    );
  }

}
