/* eslint-disable */
import React, { useCallback, useEffect, useState, useReducer } from 'react';
import { eventService } from '../../services/EventService';
import { apiService } from '../../services/ApiService';
import { StandalonePropertyInspector } from '@microsoft/iot-cardboard-js';
import { PropertyInspectorPatchInformationComponent } from './PropertyInspectorPatchInformationComponent/PropertyInspectorPatchInformationComponent';
import produce from 'immer';
import '@microsoft/iot-cardboard-js/themes.css';
import './PropertyInspectorComponent.scss';
import LoaderComponent from '../LoaderComponent/LoaderComponent';
import ErrorPage from '../ErrorPage/ErrorPage';

const pIActionTypes = {
    setSelectionType: 'setSelectionType',
    setSelection: 'setSelection',
    setRootAndExpandedModels: 'setRootAndExpandedModels',
    setRelationshipModel: 'setRelationshipModel',
    setIsSelectionLoading: 'setIsSelectionLoading',
    setIsPatchInformationVisible: 'setIsPatchInformationVisible',
    setPatchInformation: 'setPatchInformation',
    resetMissingModelIds: 'resetMissingModelIds',
    addMissingModelIds: 'addMissingModelIds'
};

const propertyInspectorReducer = produce((draft, action) => {
    switch (action.type) {
        case pIActionTypes.setSelectionType:
            draft.selectionType = action.payload;
            break;
        case pIActionTypes.setSelection:
            draft.selection = action.payload;
            break;
        case pIActionTypes.setRootAndExpandedModels:
            draft.rootAndExpandedModels = action.payload;
            break;
        case pIActionTypes.setRelationshipModel:
            draft.relationshipModel = action.payload;
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
        case pIActionTypes.resetMissingModelIds:
            draft.missingModelIds = [];
            break;
        case pIActionTypes.addMissingModelIds:
            if (Array.isArray(action.payload)) {
                draft.missingModelIds = [
                    ...draft.missingModelIds,
                    ...action.payload
                ];
            } else {
                draft.missingModelIds.push(action.payload);
            }
            break;
    }
});

const PropertyInspectorComponent = ({ isOpen, onErrorBoundary }) => {
    const [state, dispatch] = useReducer(propertyInspectorReducer, {
        selectionType: null,
        selection: null,
        rootAndExpandedModels: null,
        relationshipModel: null,
        isSelectionLoading: false,
        isPatchInformationVisible: false,
        patchInformation: null,
        missingModelIds: []
    });

    const subscribeSelection = () => {
        eventService.subscribeSelection((payload) => {
            dispatch({
                type: pIActionTypes.setIsSelectionLoading,
                payload: true
            });
            dispatch({ type: pIActionTypes.setSelectionType, payload: null });
            dispatch({ type: pIActionTypes.setSelection, payload: null });
            if (payload && payload.selection !== state.selection) {
                const { selection, selectionType } = payload;
                queryModelsAndSetSelection(selection, selectionType);
            } else {
                dispatch({
                    type: pIActionTypes.setIsSelectionLoading,
                    payload: false
                });
            }
        });
    };

    const getModelDependencies = (models, rootModelId) => {
        const flatModels = [];

        const addModelDependencies = (modelId) => {
            const model = models.find((m) => m.id === modelId)?.model;
            if (!model) {
                dispatch({
                    type: pIActionTypes.addMissingModelIds,
                    payload: modelId
                });
            } else {
                flatModels.push(model);

                if (model.extends) {
                    const extendedModelIds = Array.isArray(model.extends)
                        ? model.extends
                        : [model.extends];
                    extendedModelIds.forEach((id) => addModelDependencies(id));
                }
                if (model.contents) {
                    const componentIds = model.contents
                        .filter((c) => c['@type'] === 'Component')
                        .map((c) => c.schema);
                    componentIds.forEach((id) => addModelDependencies(id));
                }
            }
        };

        addModelDependencies(rootModelId);
        return flatModels;
    };

    const queryModelsAndSetSelection = async (selection, selectionType) => {
        dispatch({
            type: pIActionTypes.setIsSelectionLoading,
            payload: true
        });

        dispatch({
            type: pIActionTypes.resetMissingModelIds
        });

        if (selectionType === 'twin') {
            const models = await apiService.queryModels();
            const rootModel = models.find(
                (m) => m.id === selection['$metadata']['$model']
            );

            if (!rootModel) {
                dispatch({
                    type: pIActionTypes.addMissingModelIds,
                    payload: selection['$metadata']['$model']
                });
                dispatch({
                    type: pIActionTypes.setRootAndExpandedModels,
                    payload: {
                        rootModel: null,
                        expandedModels: []
                    }
                });
            } else {
                const expandedModels = getModelDependencies(
                    models,
                    rootModel?.id
                );
                dispatch({
                    type: pIActionTypes.setRootAndExpandedModels,
                    payload: {
                        rootModel: rootModel?.model,
                        expandedModels
                    }
                });
            }
        } else if (selectionType === 'relationship') {
            const sourceTwin = await apiService.getTwinById(
                selection['$sourceId']
            );
            const models = await apiService.queryModels();
            const rootModel = models.find(
                (m) => m.id === sourceTwin['$metadata']['$model']
            );

            if (!rootModel) {
                dispatch({
                    type: pIActionTypes.addMissingModelIds,
                    payload: sourceTwin['$metadata']['$model']
                });
                dispatch({
                    type: pIActionTypes.setRelationshipModel,
                    payload: null
                });
            } else {
                const expandedModels = getModelDependencies(
                    models,
                    rootModel?.id
                );
                let relationshipModel = null;

                for (const model of expandedModels) {
                    if (model.contents) {
                        for (const item of model.contents) {
                            const type = Array.isArray(item['@type'])
                                ? item['@type'][0]
                                : item['@type'];
                            if (
                                type === 'Relationship' &&
                                selection['$relationshipName'] === item.name
                            ) {
                                relationshipModel = model;
                                break;
                            }
                        }
                    }
                    if (relationshipModel) break;
                }

                dispatch({
                    type: pIActionTypes.setRelationshipModel,
                    payload: relationshipModel
                });
            }
        }

        dispatch({
            type: pIActionTypes.setSelectionType,
            payload: selectionType
        });
        dispatch({
            type: pIActionTypes.setSelection,
            payload: selection
        });
        dispatch({
            type: pIActionTypes.setIsSelectionLoading,
            payload: false
        });
    };

    const subscribeCreateModel = () => {
        eventService.subscribeCreateModel((_models) => {
            dispatch({ type: pIActionTypes.setSelectionType, payload: null });
            dispatch({ type: pIActionTypes.setSelection, payload: null });
        });
    };

    const subscribeDeleteModel = () => {
        eventService.subscribeDeleteModel((_model) => {
            dispatch({ type: pIActionTypes.setSelectionType, payload: null });
            dispatch({ type: pIActionTypes.setSelection, payload: null });
        });
    };

    const onUpdateTwin = useCallback(
        async (patchData) => {
            dispatch({
                type: pIActionTypes.setIsSelectionLoading,
                payload: true
            });

            try {
                await apiService.updateTwin(patchData.id, patchData.patches);
            } catch (err) {
                dispatch({
                    type: pIActionTypes.setIsSelectionLoading,
                    payload: false
                });
                dispatch({
                    type: pIActionTypes.setPatchInformation,
                    payload: err.details.error
                });
                return;
            }

            const updatedTwin = await apiService.getTwinById(patchData.id);

            dispatch({
                type: pIActionTypes.setPatchInformation,
                payload: patchData.patches
            });

            dispatch({
                type: pIActionTypes.setSelection,
                payload: updatedTwin
            });

            dispatch({
                type: pIActionTypes.setIsSelectionLoading,
                payload: false
            });
        },
        [dispatch, apiService]
    );

    const onUpdateRelationship = useCallback(
        async (patchData) => {
            dispatch({
                type: pIActionTypes.setIsSelectionLoading,
                payload: true
            });

            try {
                await apiService.updateRelationship(
                    patchData.sourceTwinId,
                    patchData.id,
                    patchData.patches
                );
            } catch (err) {
                dispatch({
                    type: pIActionTypes.setIsSelectionLoading,
                    payload: false
                });
                dispatch({
                    type: pIActionTypes.setPatchInformation,
                    payload: err.details.error
                });
                return;
            }

            try {
                const updatedRelationship = await apiService.getRelationship(
                    patchData.sourceTwinId,
                    patchData.id
                );

                dispatch({
                    type: pIActionTypes.setPatchInformation,
                    payload: patchData.patches
                });

                dispatch({
                    type: pIActionTypes.setSelection,
                    payload: updatedRelationship.body
                });

                dispatch({
                    type: pIActionTypes.setIsSelectionLoading,
                    payload: false
                });
            } catch (err) {
                console.err(err);
            }
        },
        [dispatch, apiService]
    );

    // On mount
    useEffect(() => {
        subscribeSelection();
        subscribeCreateModel();
        subscribeDeleteModel();
    }, []);

    if (state.isSelectionLoading) {
        return isOpen ? <LoaderComponent /> : null;
    }

    if (!state.selection) {
        return null;
    }

    if (state.selectionType === 'twin') {
        return (
            <div className="property-inspector-container">
                <PropertyInspectorPatchInformationComponent
                    isVisible={state.isPatchInformationVisible}
                    patch={state.patchInformation}
                    onCloseModal={() =>
                        dispatch({
                            type: pIActionTypes.setIsPatchInformationVisible,
                            payload: false
                        })
                    }
                />

                <StandalonePropertyInspector
                    theme={'explorer'}
                    inputData={{
                        rootModel: state.rootAndExpandedModels.rootModel,
                        expandedModels:
                            state.rootAndExpandedModels.expandedModels,
                        twin: state.selection
                    }}
                    onCommitChanges={onUpdateTwin}
                    missingModelIds={state.missingModelIds}
                    onErrorBoundary={onErrorBoundary}
                />
            </div>
        );
    } else if (state.selectionType === 'relationship') {
        return (
            <div className="property-inspector-container">
                <PropertyInspectorPatchInformationComponent
                    isVisible={state.isPatchInformationVisible}
                    patch={state.patchInformation}
                    onCloseModal={() =>
                        dispatch({
                            type: pIActionTypes.setIsPatchInformationVisible,
                            payload: false
                        })
                    }
                />

                <StandalonePropertyInspector
                    theme={'explorer'}
                    inputData={{
                        relationship: state.selection,
                        relationshipModel: state.relationshipModel
                    }}
                    onCommitChanges={onUpdateRelationship}
                    missingModelIds={state.missingModelIds}
                    onErrorBoundary={onErrorBoundary}
                />
            </div>
        );
    } else {
        return null;
    }
};

const PropertyInspectorErrorContainer = (props) => {
    const [error, setError] = useState(null);
    const [key, setKey] = useState(1);

    const subscribeSelection = () => {
        eventService.subscribeSelection((payload) => {
            if (!payload || !payload.selection) {
                setError(null);
            }
        });
    };

    useEffect(() => {
        subscribeSelection();
    }, [])

    if (error) {
        return (
            <div className="property-inspector-container">
                <ErrorPage
                    error={error}
                    resetErrorBoundary={() => {
                        setKey(prevKey => prevKey + 1);
                        setError(null);
                    }}
                    isGlobalBoundary={false}
                />
            </div>
        )
    } else {
        return <PropertyInspectorComponent {...props} key={key} onErrorBoundary={(error) => setError(error)} />
    }
}

export default React.memo(PropertyInspectorErrorContainer);
