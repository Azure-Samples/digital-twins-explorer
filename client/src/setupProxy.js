// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const { DefaultAzureCredential } = require("@azure/identity");
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const credential = new DefaultAzureCredential();
  const credentialRBAC = new DefaultAzureCredential();
  const credentialGraph = new DefaultAzureCredential();
  let token = null;
  let tokenRBAC = null;
  let tokenGraph = null;

  async function tokenSetRefresh(trToken, trCredential, trContext) {
    let tmpTrToken = trToken;
    if (!tmpTrToken || tmpTrToken.expiresOnTimestamp < Date.now()) {
      tmpTrToken = await trCredential.getToken(trContext);
    }
    return tmpTrToken;
  }

  const pathRewrite = async function (path, req) {
    let destinationPath = "/api/proxy";
    let requestToken = token;
    if (path.startsWith("/api/proxy/RBAC")) {
      destinationPath = "/api/proxy/RBAC";
      requestToken = await tokenSetRefresh(tokenRBAC, credentialRBAC, "https://management.azure.com/.default");
    } else if (path.startsWith("/api/proxy/Graph")) {
      destinationPath = "/api/proxy/Graph";
      requestToken = await tokenSetRefresh(tokenGraph, credentialGraph, "https://graph.microsoft.com/.default");
    } else {
      destinationPath = "/api/proxy";
      requestToken = await tokenSetRefresh(token, credential, "https://digitaltwins.azure.net/.default");
    }
    req.headers.authorization = `Bearer ${requestToken.token}`;
    return path.replace(destinationPath, "");
  };

  app.use(
    "/api/proxy",
    createProxyMiddleware({
      changeOrigin: true,
      headers: {
        connection: "keep-alive"
      },
      target: "/",
      onProxyReq: proxyReq => {
        if (proxyReq.getHeader("origin")) {
          proxyReq.removeHeader("origin");
          proxyReq.removeHeader("referer");
        }
      },
      pathRewrite,
      router: req => `https://${req.headers["x-adt-host"]}/`
    })
  );
};
