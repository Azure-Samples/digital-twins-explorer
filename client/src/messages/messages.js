// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const Messages = {
  error: {
    render: (error, componentStack, componentName) =>
      `${componentName} render error: ${error}. Error Component Stack: ${componentStack}`,
    service: error => {
      const { message, stack } = error;
      return `Request failed: ${message}. ${stack}`;
    }
  }
};

export default Messages;

