// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import jsonlint from "jsonlint";

export function readFile(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = "";
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function (e) {
      content = e.target.result;

      try {
        const result = jsonlint.parse(content);
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

export function addNavigator(cy, navigationOptions, container) {
  const nav = cy.navigator({ ...navigationOptions, container });

  /* Sometimes the navigator thumbnail update fails as the DOM is not
     in the correct state to be modified. As a workaround, this function
     replaces the rendering event handlers added by the navigator with
     one that is wrapped in a try/catch. */
  const fn = nav._onRenderHandler;
  cy.offRender(fn);

  const newFn = function () {
    try {
      fn();
      // Add navigator image alt for accessibility purposes
      const imgEl = document.getElementById(container.replace("#", "")).getElementsByTagName("img")[0];
      if (imgEl) {
        if (imgEl.src) {
          imgEl.setAttribute("alt", "graph navigator");
        } else {
          imgEl.removeAttribute("alt");
        }
      }
    } catch (e) {
      // Retry the render function after a timeout
      setTimeout(newFn, nav.options.rerenderDelay);
    }
  };

  nav._onRenderHandler = newFn;
  cy.onRender(newFn);
}
