// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class StorageService {

  getLocalStoragePrimitive = name => localStorage.getItem(name)

  getLocalStorageObject = name => {
    try {
      return JSON.parse(localStorage.getItem(name));
    } catch (e) {
      return {appAdtUrl: ""};
    }
  }

  setLocalStorageObject = (name, dataObj) => localStorage.setItem(name, JSON.stringify(dataObj))

  removeLocalStorageObject = name => localStorage.removeItem(name)

}

export const storageService = new StorageService();
