// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class StorageService {

  getLocalStoragePrimitive = name => localStorage.getItem(name)

  /* In the event that a local storage key is malformed (not JSON parsable),
  we gracefully fallback. If it is for configuration,
  we provide an appAdtUrl that is empty string to avoid object destructuring
  issues on code blocks dependent on that specific structure */
  getLocalStorageObject = name => {
    try {
      return JSON.parse(localStorage.getItem(name));
    } catch (e) {
      if (name === "configuration") {
        return {appAdtUrl: ""};
      }
      return {};
    }
  }

  setLocalStorageObject = (name, dataObj) => localStorage.setItem(name, JSON.stringify(dataObj))

  removeLocalStorageObject = name => localStorage.removeItem(name)

}

export const storageService = new StorageService();
