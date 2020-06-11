// From: https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
export function syntaxHighlight(json) {
  const updatedJson = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return updatedJson
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        let cls = "number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return `<span class="${cls}">${match}</span>`;
      });
}

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
