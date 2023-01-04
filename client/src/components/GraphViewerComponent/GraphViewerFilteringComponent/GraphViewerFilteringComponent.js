import React, { useState, useEffect } from "react";
import { withTranslation } from "react-i18next";

import {
  IconButton,
  Stack,
  Pivot,
  PivotItem
} from "office-ui-fabric-react";
import GraphViewerTermManagementComponent from "../GraphViewerTermManagementComponent/GraphViewerTermManagementComponent";
import { eventService } from "../../../services/EventService";
import { isDtdlVersion3 } from "../../ErrorMessageComponent/ErrorMessageHelper";

const GraphViewerFilteringComponent = ({
  toggleFilter,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onCenter,
  onAddFilteringTerm,
  onRemoveFilteringTerm,
  onAddHighlightingTerm,
  onRemoveHighlightingTerm,
  onUpdateFilteringTerm,
  onUpdateHighlightingTerm,
  highlightingTerms,
  filteringTerms,
  onSwitchFilters,
  onSelectAllHighlighted,
  selectAllHighlightedText,
  onSelectAllFiltered,
  selectAllFilteredText,
  deselectAll,
  canSelectAllFilter,
  canSelectAllHighlight,
  onClearAll,
  t
}) => {
  const filterButtonText = canSelectAllFilter ? selectAllFilteredText : t("graphViewerFilteringComponent.deselectAll");
  const highlightButtonText = canSelectAllHighlight ? selectAllHighlightedText : t("graphViewerFilteringComponent.deselectAll");

  const [ state, setState ] = useState({containerClass: "gc-controls"});

  useEffect(() => {
    eventService.subscribeError(exc => {
      if (isDtdlVersion3(exc)) {
        setState({containerClass: "gc-controls-with-error"});
      }
    });
    eventService.subscribeHideWarningMessage(() => {
      setState({containerClass: "gc-controls"});
    });
  });
  return (
    <>
      <div className={state.containerClass}>
        <Stack horizontal={false}>
          <div className="controls_buttonGroup">
            <IconButton
              iconProps={{ iconName: "ZoomIn" }}
              title={t("graphViewerFilteringComponent.zoomIn")}
              ariaLabel={t("graphViewerFilteringComponent.zoomIn")}
              ariaLive="assertive"
              onClick={onZoomIn}
              className="control-loadButtons" />
            <IconButton
              iconProps={{ iconName: "ZoomOut" }}
              title={t("graphViewerFilteringComponent.zoomOut")}
              ariaLabel={t("graphViewerFilteringComponent.zoomOut")}
              ariaLive="assertive"
              onClick={onZoomOut}
              className="control-loadButtons" />
          </div>
          <div className="controls_singleButton">
            <IconButton
              iconProps={{ iconName: "SetToCenter" }}
              title={t("graphViewerFilteringComponent.center")}
              ariaLabel={t("graphViewerFilteringComponent.center")}
              ariaLive="assertive"
              onClick={onCenter}
              className="control-loadButtons" />
          </div>
          <div className="controls_singleButton">
            <IconButton
              iconProps={{ iconName: "ZoomToFit" }}
              title={t("graphViewerFilteringComponent.zoomToFit")}
              ariaLabel={t("graphViewerFilteringComponent.zoomToFit")}
              ariaLive="assertive"
              onClick={onZoomToFit}
              className="control-loadButtons" />
          </div>
          <div className="controls_singleButton filter_button">
            <IconButton
              iconProps={{ iconName: "Filter" }}
              title={t("graphViewerFilteringComponent.filter")}
              ariaLabel={t("graphViewerFilteringComponent.filter")}
              ariaLive="assertive"
              className="control-loadButtons"
              onClick={toggleFilter} />
          </div>
        </Stack>
      </div>
      <div className="gc-filter-contents">
        <div>
          <Pivot onLinkClick={onSwitchFilters} className="filtering-pivot">
            <PivotItem headerText={t("graphViewerFilteringComponent.header1")} key="filter">
              <GraphViewerTermManagementComponent
                onAddFilteringTerm={onAddFilteringTerm}
                onRemoveFilteringTerm={onRemoveFilteringTerm}
                onUpdateTerm={onUpdateFilteringTerm}
                onAction={canSelectAllFilter ? onSelectAllFiltered : deselectAll}
                actionText={filteringTerms.length > 0 ? filterButtonText : ""}
                onClearAll={onClearAll}
                terms={filteringTerms} />
            </PivotItem>
            <PivotItem headerText={t("graphViewerFilteringComponent.header2")} key="highlight">
              <GraphViewerTermManagementComponent
                onAddFilteringTerm={onAddHighlightingTerm}
                onRemoveFilteringTerm={onRemoveHighlightingTerm}
                onUpdateTerm={onUpdateHighlightingTerm}
                onAction={canSelectAllHighlight ? onSelectAllHighlighted : deselectAll}
                actionText={highlightingTerms.length > 0 ? highlightButtonText : ""}
                onClearAll={onClearAll}
                terms={highlightingTerms} />
            </PivotItem>
          </Pivot>
        </div>
      </div>
    </>
  );
};


export default withTranslation()(GraphViewerFilteringComponent);
