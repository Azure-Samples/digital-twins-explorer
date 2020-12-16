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

  const pathRewrite = async function (path, req) {
    if (path.startsWith("/api/proxy/RBAC")) {
      if (!tokenRBAC || tokenRBAC.expiresOnTimestamp < Date.now()) {
        tokenRBAC = await credentialRBAC.getToken("https://management.azure.com/.default");
      }
      req.headers.authorization = `Bearer ${tokenRBAC.token}`;
      return path.replace("/api/proxy/RBAC", "");
    }
    if (path.startsWith("/api/proxy/Graph")) {
      if (!tokenGraph || tokenGraph.expiresOnTimestamp < Date.now()) {
        tokenGraph = await credentialGraph.getToken("https://graph.microsoft.com/.default");
      }
      req.headers.authorization = `Bearer ${tokenGraph.token}`;
      return path.replace("/api/proxy/Graph", "");
    }
    if (!token || token.expiresOnTimestamp < Date.now()) {
      token = await credential.getToken("https://digitaltwins.azure.net/.default");
    }
    req.headers.authorization = `Bearer ${token.token}`;
    return path.replace("/api/proxy", "");
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
