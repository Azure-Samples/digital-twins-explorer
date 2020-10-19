// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const { DefaultAzureCredential } = require("@azure/identity");
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const credential = new DefaultAzureCredential();
  let token = null;

  const pathRewrite = async function (path, req) {
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
