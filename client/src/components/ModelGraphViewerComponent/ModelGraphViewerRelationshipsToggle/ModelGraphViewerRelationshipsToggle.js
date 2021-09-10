import React from "react";
import { Toggle } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import "./ModelGraphViewerRelationshipsToggle.scss";

const ModelGraphViewerRelationshipsToggle = ({
  onRelationshipsToggleChange,
  onInheritancesToggleChange,
  onComponentsToggleChange,
  showRelationships,
  showInheritances,
  showComponents,
  setFirstItemRef,
  onKeyDown,
  t
}) => (
  <div className="relationship-key">
    <div className="rels-wrap">
      <div className="rel-key">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 8.86">
          <g>
            <polygon
              fill="#ffb200"
              points="18.57 0 17.3 1.27 19.96 3.93 0 3.93 0 4.93 19.96 4.93 17.3 7.59 18.57 8.86 23 4.43 18.57 0" />
          </g>
        </svg>
        <span className="rel-title">Relationships</span>
        <Toggle
          id="relationships-toggle"
          className="rel-toggle"
          checked={showRelationships}
          ariaLabel={t("modelGraphViewerRelationshipsToggle.relationshipsToggle")}
          ref={setFirstItemRef}
          onKeyDown={onKeyDown}
          onChange={onRelationshipsToggleChange} />
      </div>
      <div className="rel-key">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.15 9.46">
          <g>
            <path
              fill="#008945"
              d="M15,9.46l8.19-4.73L15,0V4.23H0v1H15V9.46Zm1-7.84,5.4,3.11-5.4,3.11Z" />
          </g>
        </svg>
        <span className="rel-title">Inheritances</span>
        <Toggle
          id="inheritances-toggle"
          className="rel-toggle"
          ariaLabel={t("modelGraphViewerRelationshipsToggle.inheritancesToggle")}
          checked={showInheritances}
          onChange={onInheritancesToggleChange} />
      </div>
      <div className="rel-key">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.06 8.12">
          <g>
            <polygon
              fill="#0078ce"
              points="23.06 3.56 7.72 3.56 4.11 0 0 4.06 4.11 8.12 7.72 4.56 23.06 4.56 23.06 3.56" />
          </g>
        </svg>
        <span className="rel-title">Components</span>
        <Toggle
          id="components-toggle"
          className="rel-toggle"
          ariaLabel={t("modelGraphViewerRelationshipsToggle.componentsToggle")}
          checked={showComponents}
          onChange={onComponentsToggleChange} />
      </div>
    </div>
  </div>
);

export default withTranslation()(ModelGraphViewerRelationshipsToggle);
