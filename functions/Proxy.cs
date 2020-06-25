// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ProxyKit;
using AdtExplorer.Functions.Utilities;

namespace AdtExplorer.Functions
{
  public class Proxy
  {
    private readonly IRequestProcessor _requestProcessor;
    private readonly ILogger<Proxy> _log;

    public Proxy(IRequestProcessor requestProcessor, ILogger<Proxy> log)
    {
      _requestProcessor = requestProcessor;
      _log = log;
    }

    [FunctionName("proxy")]
    public async Task<HttpResponseMessage> Run(
      [HttpTrigger(AuthorizationLevel.Anonymous, "GET", "POST", "PUT", "PATCH", "DELETE", Route = "proxy/{*wildcard}")] HttpRequest req)
    {
      var rpr = await _requestProcessor.ProcessAsync(req);
      if (!rpr.IsSuccess)
      {
        return HttpUtilities.BadRequest(rpr.Message);
      }

      var ctx = req.HttpContext.ForwardTo(new UpstreamHost("https", new HostString(rpr.Context.Host)));

      var uri = new UriBuilder(ctx.UpstreamRequest.RequestUri);
      uri.Path = uri.Path.Replace("api/proxy/", string.Empty);
      ctx.UpstreamRequest.RequestUri = uri.Uri;

      foreach (var header in new[] { Constants.AdtHostHeaderName, "origin", "referer" })
      {
        ctx.UpstreamRequest.Headers.Remove(header);
      }

      _log.LogInformation($"Sending proxy request to {ctx.UpstreamRequest.RequestUri}");

      var res = await ctx.Send();
      res.Headers.Remove("transfer-encoding");

      return res;
    }
  }
}
