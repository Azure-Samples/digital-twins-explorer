// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
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
      pathRewrite: path => path.replace("/api/proxy", ""),
      router: req => `https://${req.headers["x-adt-host"]}/`
    })
  );
};
