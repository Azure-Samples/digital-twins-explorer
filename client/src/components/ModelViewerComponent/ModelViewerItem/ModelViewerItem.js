// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { IconButton, Stack } from "office-ui-fabric-react";

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

export const ModelViewerItem = ({ item, itemIndex, onCreate, onView, onDelete }) => (
  <div className={classNames.item} data-is-focusable data-selection-index={itemIndex}>
    <div className="mv_listItem" data-is-focusable data-selection-toggle data-selection-invoke>
      <Stack horizontal>
        <Stack horizontal={false}>
          <div className="mv_listItemName" data-selection-invoke>{item.displayName}</div>
          <div className="mv_listItemKey" data-selection-invoke>{item.key}</div>
        </Stack>
        <div>
          <IconButton iconProps={{ iconName: "Delete" }} id={item.key}
            title="Delete Model" ariaLabel="Delete Model"
            className="mv-loadButtons" onClick={onDelete} />
          <IconButton iconProps={{ iconName: "Info" }} id={item.key}
            title="View Model" ariaLabel="View Model"
            className="mv-loadButtons" onClick={onView} />
          <IconButton iconProps={{ iconName: "AddTo" }} id={item.key}
            title="Create a Twin" ariaLabel="Create a Twin"
            className="mv-loadButtons" onClick={onCreate} />
        </div>
      </Stack>
    </div>
  </div>
);
