/* eslint-disable */
import React from "react";
import { DefaultButton } from "office-ui-fabric-react/lib/";
import logo from "../../assets/logo192.png";
import "./ErrorPage.scss";
import { useTranslation } from "react-i18next";

const ErrorPage = ({ error, resetErrorBoundary, isGlobalBoundary = true }) => {
    const { t } = useTranslation();

    return (
        <div className="error-page-container">
            <div className={`error-page-content ${isGlobalBoundary ? 'error-page-is-global' : ''}`}>
                <img className="error-page-logo" src={logo} alt="Azure Digital Twins" />
                <h2 className="error-page-header">{t('errorBoundary.modalHeader')}</h2>
                <div className="error-page-details">
                    <h3 className="error-page-message-header">{t('errorBoundary.messageHeader')}</h3>
                    <div className="error-page-message">
                        <pre>{error.name} | {error.message}</pre>
                    </div>
                    <h3 className="error-page-stack-header">{t('errorBoundary.stackHeader')}</h3>
                    <div className="error-page-stack">
                        <pre>{error.stack}</pre>
                    </div>
                </div>
                <div className="error-page-action-buttons">
                    {
                        typeof resetErrorBoundary === 'function' &&
                        <DefaultButton onClick={() => resetErrorBoundary()}>{t('errorBoundary.tryAgain')}</DefaultButton>
                    }
                </div>
            </div>
        </div>
    )
};

export default ErrorPage;