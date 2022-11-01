// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* This code is used for local development purposes only
Library consumers are responsible for creating server side middleware
as necessary and appropriate for their scenarios */

const { DefaultAzureCredential } = require("@azure/identity");
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Client identity should always be verified in hosted implementations
  // DefaultAzureCredential is used for local development purposes only
  const credentialDigitalTwins = new DefaultAzureCredential();
  const credentialRBAC = new DefaultAzureCredential();
  const credentialGraph = new DefaultAzureCredential();
  let tokenDigitalTwins = null;
  let tokenRBAC = null;
  let tokenGraph = null;

  const tokenSetRefresh = async (trToken, trCredential, trContext) => {
    let tmpTrToken = trToken;
    if (!tmpTrToken || tmpTrToken.expiresOnTimestamp < Date.now()) {
      tmpTrToken = await trCredential.getToken(trContext);
    }
    return tmpTrToken;
  };

  const pathRewrite = async (path, req) => {
    let destinationPath = null;
    let requestToken = null;
    if (path.startsWith("/api/proxy/RBAC")) {
      destinationPath = "/api/proxy/RBAC";
      tokenRBAC = await tokenSetRefresh(tokenRBAC, credentialRBAC, "https://management.azure.com/.default");
      requestToken = tokenRBAC;
    } else if (path.startsWith("/api/proxy/Graph")) {
      destinationPath = "/api/proxy/Graph";
      tokenGraph = await tokenSetRefresh(tokenGraph, credentialGraph, "https://graph.microsoft.com/.default");
      requestToken = tokenGraph;
    } else {
      destinationPath = "/api/proxy";
      tokenDigitalTwins = await tokenSetRefresh(tokenDigitalTwins, credentialDigitalTwins, "https://digitaltwins.azure.net/.default");
      requestToken = tokenDigitalTwins;
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
