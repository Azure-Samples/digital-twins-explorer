/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import { eventService } from "../../services/EventService";
import getAdtAdapter from "./AdtAdapterInstance";
import { ModelService } from "../../services/ModelService";
import { PropertyInspector } from '@microsoft/iot-cardboard-js';
import "@microsoft/iot-cardboard-js/themes.css";
import "./PropertyInspectorComponentV2.scss";

const PropertyInspectorComponent = () => {

    const [selectionType, setSelectionType] = useState(null);
    const [selection, setSelection] = useState(null);
    const [rootAndBaseModelIdsToFlatten, setRootAndBaseModelIdsToFlatten] = useState(null);
    const [adapter, setAdapter] = useState(null);

    const modelService = useRef(new ModelService());

    const subscribeSelection = () => {
        eventService.subscribeSelection(payload => {
            if (payload) {
                const { selection, selectionType } = payload;
                flattenModelAndSetSelection(selection, selectionType);
            } else {
                setSelectionType(null);
                setSelection(null);
            }
        });
    }

    const flattenModelAndSetSelection = async (selection, selectionType) => {
        const baseModelIds = (await modelService.current.getModel(selection['$metadata']['$model'])).bases;
        setRootAndBaseModelIdsToFlatten({
            rootModelId: selection['$metadata']['$model'],
            baseModelIds: baseModelIds
        })
        setSelectionType(selectionType);
        setSelection(selection);
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
                    resolvedTwin={selection}
                    twinId={selection['$dtId']}
                    adapter={adapter}
                    rootAndBaseModelIdsToFlatten={{
                        baseModelIds: rootAndBaseModelIdsToFlatten.baseModelIds,
                        rootModelId: rootAndBaseModelIdsToFlatten.rootModelId
                    }}
                />
            </div>
        );
    } else if (selectionType === 'relationship') {
        return (
            <div className="property-inspector-container">
                <PropertyInspector
                    resolvedRelationship={selection}
                    relationshipId={selection['$relationshipId']}
                    twinId={selection['$sourceId']}
                    adapter={adapter}
                    rootAndBaseModelIdsToFlatten={{
                        baseModelIds: rootAndBaseModelIdsToFlatten.baseModelIds,
                        rootModelId: rootAndBaseModelIdsToFlatten.rootModelId
                    }}
                />
            </div>
        );
    } else {
        return null;
    }
}

export default PropertyInspectorComponent;