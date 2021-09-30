// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { Stack } from "office-ui-fabric-react";
import ModelViewerItemCommandBarComponent from "../ModelViewerItemCommandBarComponent/ModelViewerItemCommandBarComponent";
import { withTranslation } from "react-i18next";

const TAB_KEY_CODE = 9;
const ARROW_DOWN_KEY_CODE = 40;
const ARROW_UP_KEY_CODE = 38;
const SPACE_CODE = 32;
const ENTER_KEY_CODE = 13;

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

const ModelViewerItem = ({ item, itemIndex, onCreate, onView, onDelete, onSelect,
  onSetModelImage, onUpdateModelImage, modelImage, isSelected, onFocus, onBlur, onArrowDown, onArrowUp, setRef, onTab, showItemMenu, t }) => {
  const uploadModelImageRef = React.createRef();
  const commandBar = React.createRef();

  const onHandleModelImage = () => {
    if (modelImage) {
      onUpdateModelImage(item.key, uploadModelImageRef);
    } else {
      uploadModelImageRef.current.click();
    }
  };

  const onKeyDownItem = e => {
    switch (e.keyCode) {
      case ARROW_DOWN_KEY_CODE:
        onArrowDown();
        break;
      case ARROW_UP_KEY_CODE:
        onArrowUp();
        break;
      case SPACE_CODE:
        e.preventDefault();
        commandBar.current.clickOverflowButton();
        break;
      case ENTER_KEY_CODE:
        onSelect();
        break;
      default:
        break;
    }
  };

  const onKeyDownMenu = e => {
    if (e.keyCode === TAB_KEY_CODE && !e.shiftKey) {
      onTab(e);
    }
  };

  return (
    <div className={classNames.item} tabIndex="0" data-selection-index={itemIndex} data-selection-toggle
      data-is-focusable onClick={onSelect} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDownItem} ref={setRef}>
      <div className={`mv_listItem ${isSelected ? "mv_listItem_selected" : ""}`} data-selection-invoke>
        <Stack horizontal={false}>
          <Stack horizontal>
            <div className="mv_listItemName testClass" aria-label={`list-item-${item.displayName}`} role="listitem" data-selection-invoke>{item.displayName}</div>
            <div className="mv_buttonGroup" title={t("modelViewerItem.moreButton")} aria-label={t("modelViewerItem.moreButton")}>
              <ModelViewerItemCommandBarComponent
                item={item}
                buttonClass="mv-loadButtons"
                onDelete={onDelete}
                onHandleModelImage={onHandleModelImage}
                onCreate={onCreate}
                onKeyDown={onKeyDownMenu}
                ref={commandBar}
                showItemMenu={showItemMenu}
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

export default withTranslation("translation", { withRef: true })(ModelViewerItem);

