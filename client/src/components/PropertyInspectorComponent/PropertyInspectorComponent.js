/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { eventService } from "../../services/EventService";
import getAdtAdapter from "./AdtAdapterInstance";
import { ModelService } from "../../services/ModelService";
import { apiService } from "../../services/ApiService";
import { PropertyInspector } from '@microsoft/iot-cardboard-js';
import { PropertyInspectorPatchInformationComponent }
  from "./PropertyInspectorPatchInformationComponent/PropertyInspectorPatchInformationComponent";
import produce from "immer"
import "@microsoft/iot-cardboard-js/themes.css";
import "./PropertyInspectorComponent.scss";


const pIActionTypes = {
    setSourceTwin: 'setSourceTwin',
    setSelectionType: 'setSelectionType',
    setSelection: 'setSelection',
    setRootAndBaseModelIdsToFlatten: 'setRootAndBaseModelIdsToFlatten',
    setAdapter: 'setAdapter',
    setIsSelectionLoading: 'setIsSelectionLoading',
    setIsPatchInformationVisible: 'setIsPatchInformationVisible',
    setPatchInformation: 'setPatchInformation',
    incrementPiKey: 'incrementPiKey'
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
        case pIActionTypes.setIsPatchInformationVisible:
            draft.isPatchInformationVisible = action.payload;
            break;
        case pIActionTypes.setPatchInformation:
            draft.patchInformation = action.payload;
            draft.isPatchInformationVisible = true;
            break;
        case pIActionTypes.incrementPiKey:
            draft.piKey = draft.piKey + 1;
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
        isSelectionLoading: false,
        isPatchInformationVisible: false,
        patchInformation: null,
        piKey: 1
    })

    const subscribeSelection = () => {
        eventService.subscribeSelection(payload => {
            dispatch({ type: pIActionTypes.setIsSelectionLoading, payload: true });
            dispatch({ type: pIActionTypes.setSelectionType, payload: null });
            dispatch({ type: pIActionTypes.setSelection, payload: null });
            if (payload) {
                const { selection, selectionType } = payload;
                flattenModelAndSetSelection(selection, selectionType);
            } else {
                dispatch({ type: pIActionTypes.setIsSelectionLoading, payload: false });
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

    const subscribeCreateModel = () => {
        eventService.subscribeCreateModel(_models => {
            dispatch({
                type: pIActionTypes.incrementPiKey
            })
        });
    }

    const subscribeDeleteModel = () => {
        eventService.subscribeDeleteModel(_model => {
            dispatch({
                type: pIActionTypes.incrementPiKey
            })
        });
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
        subscribeCreateModel();
        subscribeDeleteModel();
    }, [])

    // Set up memoized PI dependencies
    const onPatch = useCallback((patchData) => {
        dispatch({type: pIActionTypes.setPatchInformation, payload: patchData})
    }, [dispatch])

    if (!state.adapter || !state.selection) {
        return null
    };

    if (state.selectionType === 'twin') {
        return (
            <div className="property-inspector-container">
                <PropertyInspectorPatchInformationComponent
                    isVisible={state.isPatchInformationVisible}
                    patch={state.patchInformation}
                    onCloseModal={() => dispatch({
                        type: pIActionTypes.setIsPatchInformationVisible,
                        payload: false
                    })}
                />
                <PropertyInspector
                    resolvedTwin={state.selection}
                    twinId={state.selection['$dtId']}
                    adapter={state.adapter}
                    rootAndBaseModelIdsToFlatten={state.setRootAndBaseModelIdsToFlatten}
                    isPropertyInspectorLoading={state.isSelectionLoading}
                    theme={'explorer'}
                    onPatch={onPatch}
                    key={state.piKey}
                />
            </div>
        );
    } else if (state.selectionType === 'relationship') {
        return (
            <div className="property-inspector-container">
                <PropertyInspectorPatchInformationComponent
                    isVisible={state.isPatchInformationVisible}
                    patch={state.patchInformation}
                    onCloseModal={() => dispatch({
                        type: pIActionTypes.setIsPatchInformationVisible,
                        payload: false
                    })}
                />
                <PropertyInspector
                    resolvedRelationship={state.selection}
                    resolvedTwin={state.sourceTwin}
                    relationshipId={state.selection['$relationshipId']}
                    twinId={state.selection['$sourceId']}
                    adapter={state.adapter}
                    rootAndBaseModelIdsToFlatten={state.setRootAndBaseModelIdsToFlatten}
                    isPropertyInspectorLoading={state.isSelectionLoading}
                    theme={'explorer'}
                    onPatch={onPatch}
                    key={state.piKey}
                />
            </div>
        );
    } else {
        return null;
    }
}

export default PropertyInspectorComponent;