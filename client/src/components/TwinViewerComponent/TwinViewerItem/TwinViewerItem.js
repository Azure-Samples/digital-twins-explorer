// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { IconButton, Stack } from "office-ui-fabric-react";

const ENTER_KEY_CODE = 13;
const SPACE_KEY_CODE = 32;

const commonStyles = {
  display: "inline-block",
  cursor: "default",
  boxSizing: "border-box",
  verticalAlign: "top",
  background: "none",
  backgroundColor: "transparent",
  border: "none"
};

const classNames = mergeStyleSets({
  item: {
    selectors: {
      "&:hover": { background: "#444" }
    }
  },
  // Overwrites the default style for Button
  check: [ commonStyles, { padding: "11px 8px" } ],
  cell: [
    commonStyles,
    {
      overflow: "hidden",
      height: 36,
      padding: 8
    }
  ]
});

export const TwinViewerItem = ({ item, relationships, itemIndex, onSelect, isSelected, onFocus, onBlur, onSelectRelationship, onSpaceRelationship, onSpace }) => {
  const handleTwinKeyDown = e => {
    if (e.keyCode === ENTER_KEY_CODE) {
      onSelect(item, e.ctrlKey);
    } else if (e.keyCode === SPACE_KEY_CODE) {
      e.preventDefault();
      onSpace(e);
    }
  };
  const handleRelationshipKeyDown = (e, rel) => {
    if (e.keyCode === ENTER_KEY_CODE) {
      onSelectRelationship(rel);
    } else if (e.keyCode === SPACE_KEY_CODE) {
      e.preventDefault();
      onSpaceRelationship(e, rel);
    }
  };
  return (
    <>
      <div className={classNames.item} data-is-focusable data-selection-index={itemIndex}>
        <div className={`tv_listItem ${isSelected ? "tv_listItem_selected" : ""}`} data-is-focusable data-selection-toggle data-selection-invoke
          onClick={() => onSelect(item, false)} onKeyDown={handleTwinKeyDown} tabIndex="0" onFocus={onFocus} onBlur={onBlur}>
          <Stack horizontal={false}>
            <Stack horizontal>
              <div className="tv_listItemName" data-selection-invoke>{item.$dtId}</div>
              <div className="tv_buttonGroup">
                <IconButton iconProps={{ iconName: isSelected ? "ChevronFold10" : "ChevronUnfold10" }}
                  iconOnly
                  tabIndex="-1"
                  aria-expanded={isSelected}
                  ariaLabel={isSelected ? "Close" : "Open"}
                  className="twin-menu-button" />
              </div>
            </Stack>
          </Stack>
        </div>
      </div>
      {isSelected && relationships.map(rel => (
        <div className="tv-relationships" key={rel.$relationshipId}>
          <Stack horizontal={false}>
            <div className="tv_listItem" tabIndex="0" onClick={() => onSelectRelationship(rel)} onKeyDown={e => handleRelationshipKeyDown(e, rel)} >
              <Stack horizontal={false}>
                <div className="tv_listItemName" data-selection-invoke>{rel.$relationshipName}</div>
                <div className="tv_listItemKey" data-selection-invoke>{item.$dtId === rel.$sourceId ? rel.$targetId : rel.$sourceId}</div>
              </Stack>
            </div>
          </Stack>
        </div>))}
    </>
  );
};

