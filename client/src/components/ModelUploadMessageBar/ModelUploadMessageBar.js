/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { MessageBar, MessageBarType, Link, DefaultButton } from "office-ui-fabric-react/lib/";
import Prism from "prismjs";
import ModalComponent from "../ModalComponent/ModalComponent";
import "./ModelUploadMessageBar.scss";

const ModelUploadMessageBar = ({ modelUploadResults, onDismiss, t }) => {
    const timeoutRef = useRef(null);
    const lastUploadResults = useRef(null);
    const [isUploadInfoModalOpen, setIsUploadInfoModalOpen] = useState(false);
    
    useEffect(() => {
        if (modelUploadResults) {
            lastUploadResults.current = modelUploadResults;
            timeoutRef.current = setTimeout(() => {
                onDismiss();
            }, 15000)
        }
        return () => clearTimeout(timeoutRef.current);
    }, [modelUploadResults])

    useEffect(() => {
        if (isUploadInfoModalOpen) {
            Prism.highlightAll();
        }
    }, [isUploadInfoModalOpen])

    return (
        <>
            <ModalComponent isVisible={isUploadInfoModalOpen} className={"model-upload-results-modal"}>
                <form onSubmit={() => setIsUploadInfoModalOpen(false)}>
                    <h2 className="heading-2" tabIndex="0">{t("modelUploadMessaging.modelUploadDetailsHeader", {modelCount: lastUploadResults.current?.length ?? 0})}</h2>
                    <div className="pre-wrapper modal-scroll">
                    {
                        lastUploadResults.current &&
                        <pre tabIndex="0" id="code-container">
                            <code className="language-js">
                                {JSON.stringify(lastUploadResults.current, null, 2)}
                            </code>
                        </pre>
                    }
                    </div>
                    <div className="btn-group">
                        <DefaultButton id="close-model-btn" className="modal-button close-button" type="submit" onClick={() => setIsUploadInfoModalOpen(false)}>
                            {t("modelUploadMessaging.closeButton")}
                        </DefaultButton>
                    </div>
                </form>
            </ModalComponent>
            { modelUploadResults &&
            <MessageBar
                aria-label={t("modelUploadMessaging.modelUploadSuccessMessage", { modelCount: modelUploadResults?.length ?? 0 })}
                messageBarType={MessageBarType.success}
                onDismiss={onDismiss}
                role="alert"
                styles={{
                    root: {
                        position: "absolute",
                        top: 0,
                        zIndex: 1
                    }
                }}
                isMultiline={false}
            >
                {t("modelUploadMessaging.modelUploadSuccessMessage", { modelCount: modelUploadResults?.length ?? 0 })} {' '}
                <Link onClick={() => setIsUploadInfoModalOpen(true)} underline>
                   {t('modelUploadMessaging.viewDetails')}
                </Link>
            </MessageBar>}
        </>
    );
};

export default ModelUploadMessageBar;
