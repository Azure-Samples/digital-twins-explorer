/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import { eventService } from "../../services/EventService";
import getAdtAdapter from "./AdtAdapterInstance";
import { ModelService } from "../../services/ModelService";
import { PropertyInspector } from '@microsoft/iot-cardboard-js';
import "@microsoft/iot-cardboard-js/themes.css";
import "./PropertyInspectorComponentV2.scss";

const PropertyInspectorComponent = () => {

    const [isLoadingSelection, setIsLoadingSelection] = useState(false);
    const [selectionType, setSelectionType] = useState(null);
    const [selection, setSelection] = useState(null);
    const [adapter, setAdapter] = useState(null);

    const subscribeSelection = () => {
        eventService.subscribeSelection(payload => {
            if (payload) {
                const { selection, selectionType } = payload;
                setIsLoadingSelection(true);
                setSelectionType(selectionType);
                setSelection(selection);
            } else {
                setIsLoadingSelection(false);
                setSelectionType(null);
                setSelection(null);
            }
        });
    }

    const subscribeConfigure = () => {
        eventService.subscribeConfigure(evt => {
            if (evt.type === "end") {
                setAdtAdapter();
            }
        })
    }

    const setAdtAdapter = async () => {
        const adtAdapter = await getAdtAdapter();
        setAdapter(adtAdapter);
    }

    // On mount
    useEffect(() => {
        setAdtAdapter();
        subscribeSelection();
        subscribeConfigure();
    }, [])

    if (!adapter || !selection) return null;

    if (selectionType === 'twin') {
        return (
            <div className="property-inspector-container">
                <PropertyInspector 
                    twinId={selection['$dtId']}
                    adapter={adapter}
                />
            </div>
        );
    } else if (selectionType === 'relationship') {
        return (
            <div className="property-inspector-container">
                <PropertyInspector
                    relationshipId={selection['$relationshipId']}
                    twinId={selection['$sourceId']}
                    adapter={adapter}
                />
            </div>
        );
    } else {
        return null;
    }
}

export default PropertyInspectorComponent;