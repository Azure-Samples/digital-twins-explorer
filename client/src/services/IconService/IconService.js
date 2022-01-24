/* eslint-disable */
import { initializeIcons, registerIcons } from "office-ui-fabric-react";
import { ReactComponent as BulkUploadFolder } from '../../assets/BulkUploadFolder.svg';
import { ReactComponent as ExpansionDirection } from '../../assets/ExpansionDirection.svg';
import { ReactComponent as ExpansionLevel } from '../../assets/ExpansionLevel.svg';
import { ReactComponent as SetToCenter } from '../../assets/SetToCenter.svg';
import { ReactComponent as ChooseLayout } from '../../assets/ChooseLayout.svg';
import { ReactComponent as SwapRelationship } from '../../assets/SwapRelationship.svg';
import { ReactComponent as WarningRelationship } from '../../assets/WarningRelationship.svg';
import "./IconService.scss";

const initIcons = () => {
    initializeIcons();

    const iconStyles = {
        width: '16px',
        height: '16px',
    };

    const customIcons = {
        icons: {
            'BulkUploadFolder': <BulkUploadFolder className="ms-Button-icon custom-svg-icon" style={iconStyles} />,
            'ExpansionDirection': <ExpansionDirection className="ms-Button-icon iconWhite" style={iconStyles} />,
            'ExpansionLevel': <ExpansionLevel className="ms-Button-icon iconWhite" style={iconStyles} />,
            'SetToCenter': <SetToCenter className="ms-Button-icon" style={iconStyles} />,
            'ChooseLayout': <ChooseLayout className="ms-Button-icon iconWhite" style={iconStyles} />,
            'SwapRelationship': <SwapRelationship className="ms-Button-icon" style={iconStyles} />,
            'WarningRelationship': <WarningRelationship className="ms-Button-icon iconWhite" style={iconStyles} />
        }
    };

    // Register custom icons to fabric
    registerIcons(customIcons);
};

export default initIcons;
