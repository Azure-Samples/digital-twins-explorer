// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class StorageService {

  getLocalStorageObject = name => JSON.parse(localStorage.getItem(name))

  setLocalStorageObject = (name, dataObj) => localStorage.setItem(name, JSON.stringify(dataObj))

  removeLocalStorageObject = name => localStorage.removeItem(name)

}

export const storageService = new StorageService();
