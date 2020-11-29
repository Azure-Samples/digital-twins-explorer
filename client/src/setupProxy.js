// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const { DefaultAzureCredential } = require("@azure/identity");
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const credential = new DefaultAzureCredential();
  const credentialRBAC = new DefaultAzureCredential();
  let token = null;
  let tokenRBAC = null;

  const pathRewrite = async function (path, req) {
    if(path.startsWith("/api/proxy/RBAC")){
      if (!tokenRBAC || tokenRBAC.expiresOnTimestamp < Date.now()) {
        tokenRBAC = await credentialRBAC.getToken("https://management.azure.com/.default");
      }
      req.headers.authorization = `Bearer ${tokenRBAC.token}`;
      console.log(`Bearer ${tokenRBAC.token}`);
      return path.replace("/api/proxy/RBAC", "");
    }
    else{
      if (!token || token.expiresOnTimestamp < Date.now()) {
        token = await credential.getToken("https://digitaltwins.azure.net/.default");
      }
      req.headers.authorization = `Bearer ${token.token}`;
      console.log(`Bearer ${token.token}`);
      return path.replace("/api/proxy", "");
    }

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
