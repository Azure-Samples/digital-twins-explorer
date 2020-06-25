// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function readFile(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = "";
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function (e) {
      content = e.target.result;

      try {
        const result = JSON.parse(content);
        resolve(result);
      } catch (exp) {
        reject(exp);
      }
    };
    // Make sure to handle error states
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

export function sortArray(array, ...propertyNames) {
  array.sort((a, b) => {
    for (const p of propertyNames) {
      const pA = a[p].toUpperCase();
      const pB = b[p].toUpperCase();
      if (pA < pB) {
        return -1;
      }
      if (pA > pB) {
        return 1;
      }
    }

    return 0;
  });
}

export function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getUniqueRelationshipId(relationship) {
  return `${relationship.$sourceId}_${relationship.$relationshipId}`;
}
