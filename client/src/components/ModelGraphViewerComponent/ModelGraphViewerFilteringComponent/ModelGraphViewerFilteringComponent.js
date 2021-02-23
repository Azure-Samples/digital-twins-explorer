import React from "react";
import {
  IconButton,
  Stack,
  Pivot,
  PivotItem
} from "office-ui-fabric-react";
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
  resetFiltering,
  onUpdateFilteringTerm,
  onUpdateHighlightingTerm
}) => (
  <>
    <div className="gc-controls">
      <Stack horizontal={false}>
        <div className="controls_buttonGroup">
          <IconButton
            iconProps={{ iconName: "Add" }}
            title="Zoom in"
            ariaLabel="Zoom in"
            onClick={onZoomIn}
            className="control-loadButtons" />
          <IconButton
            iconProps={{ iconName: "CalculatorSubtract" }}
            title="Zoom out"
            ariaLabel="Zoom out"
            onClick={onZoomOut}
            className="control-loadButtons" />
        </div>
        <div className="controls_singleButton">
          <IconButton
            iconProps={{ iconName: "ZoomToFit" }}
            title="Zoom to fit"
            ariaLabel="Zoom to fit"
            onClick={onZoomToFit}
            className="control-loadButtons" />
        </div>
        <div className="controls_singleButton filter_button">
          <IconButton
            iconProps={{ iconName: "Filter" }}
            title="Toggle model filter drawer"
            ariaLabel="Toggle model filter drawer"
            className="control-loadButtons"
            onClick={toggleFilter} />
        </div>
      </Stack>
    </div>
    <div className="gc-filter-contents">
      <div>
        <Pivot onLinkClick={resetFiltering}>
          <PivotItem headerText="Filter">
            <ModelGraphViewerTermManagementComponent
              onAddFilteringTerm={onAddFilteringTerm}
              onRemoveFilteringTerm={onRemoveFilteringTerm}
              onUpdateTerm={onUpdateFilteringTerm} />
          </PivotItem>
          <PivotItem headerText="Highlight">
            <ModelGraphViewerTermManagementComponent
              onAddFilteringTerm={onAddHighlightingTerm}
              onRemoveFilteringTerm={onRemoveHighlightingTerm}
              onUpdateTerm={onUpdateHighlightingTerm} />
          </PivotItem>
        </Pivot>
      </div>
    </div>
  </>
);

export default ModelGraphViewerFilteringComponent;
