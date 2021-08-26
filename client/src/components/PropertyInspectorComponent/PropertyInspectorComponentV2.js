/* eslint-disable */
import { useEffect, useReducer } from "react";
import { eventService } from "../../services/EventService";
import getAdtAdapter from "./AdtAdapterInstance";
import { ModelService } from "../../services/ModelService";
import { apiService } from "../../services/ApiService";
import { PropertyInspector, Theme } from '@microsoft/iot-cardboard-js';
import produce from "immer"
import "@microsoft/iot-cardboard-js/themes.css";
import "./PropertyInspectorComponentV2.scss";

const pIActionTypes = {
    setSourceTwin: 'setSourceTwin',
    setSelectionType: 'setSelectionType',
    setSelection: 'setSelection',
    setRootAndBaseModelIdsToFlatten: 'setRootAndBaseModelIdsToFlatten',
    setAdapter: 'setAdapter',
    setIsSelectionLoading: 'setIsSelectionLoading'
} 

const propertyInspectorReducer = produce((draft, action) => {
    switch (action.type) {
        case pIActionTypes.setSourceTwin:
            draft.sourceTwin = action.payload;
            break;
        case pIActionTypes.setSelectionType:
            draft.selectionType = action.payload;
            break;
        case pIActionTypes.setSelection:
            draft.selection = action.payload;
            break;
        case pIActionTypes.setRootAndBaseModelIdsToFlatten:
            draft.rootAndBaseModelIdsToFlatten = action.payload;
            break;
        case pIActionTypes.setAdapter:
            draft.adapter = action.payload;
            break;
        case pIActionTypes.setIsSelectionLoading:
            draft.isSelectionLoading = action.payload;
            break;
    }
})

const PropertyInspectorComponent = () => {

    const [state, dispatch] = useReducer(propertyInspectorReducer, {
        sourceTwin: null,
        selectionType: null,
        selection: null,
        rootAndBaseModelIdsToFlatten: null,
        adapter: null,
        isSelectionLoading: false
    })

    const subscribeSelection = () => {
        eventService.subscribeSelection(payload => {
            if (payload) {
                const { selection, selectionType } = payload;
                dispatch({ type: pIActionTypes.setIsSelectionLoading, payload: true });
                flattenModelAndSetSelection(selection, selectionType);
            } else {
                dispatch({ type: pIActionTypes.setSelectionType, payload: null });
                dispatch({ type: pIActionTypes.setSelection, payload: null });
            }
        });
    }

    const flattenModelAndSetSelection = async (selection, selectionType) => {
        const modelService = new ModelService();
        
        if (selectionType === 'twin') {
            const baseModel = await modelService.getModel(selection['$metadata']['$model']);
            dispatch({
                type: pIActionTypes.setRootAndBaseModelIdsToFlatten,
                payload: {
                    rootModelId: selection['$metadata']['$model'],
                    baseModelIds: [...baseModel.bases, ...baseModel.components.map(c => c.id)]
                }
            })
        } else if (selectionType === 'relationship') {
            const sourceTwin = await apiService.getTwinById(selection['$sourceId']);
            dispatch({
                type: pIActionTypes.setSourceTwin,
                payload: sourceTwin
            })
            const baseModelIds = (await modelService.getModel(sourceTwin['$metadata']['$model'])).bases;
            dispatch({
                type: pIActionTypes.setRootAndBaseModelIdsToFlatten,
                payload: {
                    rootModelId: sourceTwin['$metadata']['$model'],
                    baseModelIds: baseModelIds
                }
            })
        }
        dispatch({
            type: pIActionTypes.setSelectionType,
            payload: selectionType
        })
        dispatch({
            type: pIActionTypes.setSelection,
            payload: selection
        })
        dispatch({
            type: pIActionTypes.setIsSelectionLoading,
            payload: false
        })
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
        dispatch({
            type: pIActionTypes.setAdapter,
            payload: adtAdapter
        })
    }

    // On mount
    useEffect(() => {
        setAdtAdapter();
        subscribeSelection();
        subscribeConfigure();
    }, [])

    if (!state.adapter || !state.selection) return null;

    if (state.selectionType === 'twin') {
        return (
            <div className="property-inspector-container">
                <PropertyInspector
                    resolvedTwin={state.selection}
                    twinId={state.selection['$dtId']}
                    adapter={state.adapter}
                    rootAndBaseModelIdsToFlatten={{
                        baseModelIds: state.rootAndBaseModelIdsToFlatten.baseModelIds,
                        rootModelId: state.rootAndBaseModelIdsToFlatten.rootModelId
                    }}
                    isPropertyInspectorLoading={state.isSelectionLoading}
                    theme={'explorer'}
                />
            </div>
        );
    } else if (state.selectionType === 'relationship') {
        return (
            <div className="property-inspector-container">
                <PropertyInspector
                    resolvedRelationship={state.selection}
                    resolvedTwin={state.sourceTwin}
                    relationshipId={state.selection['$relationshipId']}
                    twinId={state.selection['$sourceId']}
                    adapter={state.adapter}
                    rootAndBaseModelIdsToFlatten={{
                        baseModelIds: state.rootAndBaseModelIdsToFlatten.baseModelIds,
                        rootModelId: state.rootAndBaseModelIdsToFlatten.rootModelId
                    }}
                    isPropertyInspectorLoading={state.isSelectionLoading}
                    theme={'explorer'}
                />
            </div>
        );
    } else {
        return null;
    }
}

export default PropertyInspectorComponent;