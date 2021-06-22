import React from "react";
import {
  IconButton,
  Stack,
  Pivot,
  PivotItem
} from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";
import ModelGraphViewerTermManagementComponent from "../ModelGraphViewerTermManagementComponent/ModelGraphViewerTermManagementComponent";

const ModelGraphViewerFilteringComponent = ({
  toggleFilter,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onAddFilteringTerm,
  onRemoveFilteringTerm,
  onAddHighlightingTerm,
  onRemoveHighlightingTerm,
  onSwitchFilters,
  onUpdateFilteringTerm,
  onUpdateHighlightingTerm,
  highlightingTerms,
  filteringTerms,
  t
}) => (
  <>
    <div className="gc-controls">
      <Stack horizontal={false}>
        <div className="controls_buttonGroup">
          <IconButton
            iconProps={{ iconName: "Add" }}
            title={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomIn")}
            ariaLabel={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomIn")}
            onClick={onZoomIn}
            className="control-loadButtons" />
          <IconButton
            iconProps={{ iconName: "CalculatorSubtract" }}
            title={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomOut")}
            ariaLabel={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomOut")}
            onClick={onZoomOut}
            className="control-loadButtons" />
        </div>
        <div className="controls_singleButton">
          <IconButton
            iconProps={{ iconName: "ZoomToFit" }}
            title={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomToFit")}
            ariaLabel={t("modelGraphViewerFilteringComponent.controlsButtonGroup.zoomToFit")}
            onClick={onZoomToFit}
            className="control-loadButtons" />
        </div>
        <div className="controls_singleButton filter_button">
          <IconButton
            iconProps={{ iconName: "Filter" }}
            title={t("modelGraphViewerFilteringComponent.controlsButtonGroup.filter")}
            ariaLabel={t("modelGraphViewerFilteringComponent.controlsButtonGroup.filter")}
            className="control-loadButtons"
            onClick={toggleFilter} />
        </div>
      </Stack>
    </div>
    <div className="gc-filter-contents">
      <div>
        <Pivot onLinkClick={onSwitchFilters}>
          <PivotItem headerText={t("modelGraphViewerFilteringComponent.controlsButtonGroup.header1")} key="filter">
            <ModelGraphViewerTermManagementComponent
              onAddFilteringTerm={onAddFilteringTerm}
              onRemoveFilteringTerm={onRemoveFilteringTerm}
              terms={filteringTerms}
              onUpdateTerm={onUpdateFilteringTerm} />
          </PivotItem>
          <PivotItem headerText={t("modelGraphViewerFilteringComponent.controlsButtonGroup.header2")} key="highlight">
            <ModelGraphViewerTermManagementComponent
              onAddFilteringTerm={onAddHighlightingTerm}
              onRemoveFilteringTerm={onRemoveHighlightingTerm}
              terms={highlightingTerms}
              onUpdateTerm={onUpdateHighlightingTerm} />
          </PivotItem>
        </Pivot>
      </div>
    </div>
  </>
);

export default withTranslation()(ModelGraphViewerFilteringComponent);
