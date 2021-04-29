// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { Stack } from "office-ui-fabric-react";
import { ModelViewerItemCommandBarComponent } from "../ModelViewerItemCommandBarComponent/ModelViewerCommandBarComponent";

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

export const ModelViewerItem = ({ item, itemIndex, onCreate, onView, onDelete, onSelect, onSetModelImage, onUpdateModelImage, modelImage, isSelected }) => {
  const uploadModelImageRef = React.createRef();

  const onHandleModelImage = () => {
    if (modelImage) {
      onUpdateModelImage(item.key, uploadModelImageRef);
    } else {
      uploadModelImageRef.current.click();
    }
  };

  return (
    <div className={classNames.item} data-is-focusable data-selection-index={itemIndex} onClick={onSelect}>
      <div className={`mv_listItem ${isSelected ? "mv_listItem_selected" : ""}`} data-is-focusable data-selection-toggle data-selection-invoke>
        <Stack horizontal={false}>
          <Stack horizontal>
            <div className="mv_listItemName" data-selection-invoke>{item.displayName}</div>
            <div className="mv_buttonGroup">
              <ModelViewerItemCommandBarComponent
                item={item}
                buttonClass="mv-loadButtons"
                onDelete={onDelete}
                onHandleModelImage={onHandleModelImage}
                onCreate={onCreate}
                onView={onView} />
              <input type="file" name="image-upload" className="mv-fileInput" accept="image/png, image/jpeg"
                ref={uploadModelImageRef} onChange={evt => onSetModelImage(evt, item, uploadModelImageRef)} />
            </div>
          </Stack>
          <div className="mv_listItemKey" data-selection-invoke>{item.key}</div>
        </Stack>
      </div>
    </div>
  );
};
