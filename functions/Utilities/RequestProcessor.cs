// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

namespace AdtExplorer.Functions.Utilities
{
  public class RequestContext
  {
    public RequestContext(string host)
    {
      Host = host;
    }

    public string Host { get; private set; }
    public string InstanceName => (Host ?? string.Empty).Split(".", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
  }

  public class RequestProcessorResult
  {
    public RequestProcessorResult(bool isSuccess, RequestContext context, string message)
    {
      IsSuccess = isSuccess;
      Context = context;
      Message = message;
    }

    public bool IsSuccess { get; private set; }
    public RequestContext Context { get; private set; }
    public string Message { get; private set; }
  }

  public interface IRequestProcessor
  {
    RequestProcessorResult Process(HttpRequest req);
  }

  public class RequestProcessor : IRequestProcessor
  {
    private readonly ILogger<RequestProcessor> _log;

    public RequestProcessor(ILogger<RequestProcessor> log)
    {
      _log = log;
    }

    public RequestProcessorResult Process(HttpRequest req)
    {
      if (!TryGetAdtHostHeader(req, out var adtHostHeader))
      {
        _log.LogWarning($"Request received for {req.Path} with missing host header");
        return new RequestProcessorResult(false, null, $"Missing {Constants.AdtHostHeaderName} header");
      }

      var adtHost = ((string) adtHostHeader).ToLowerInvariant();
      if (string.IsNullOrEmpty(adtHost) || !adtHost.EndsWith(".digitaltwins.azure.net", StringComparison.OrdinalIgnoreCase)
        || !Regex.Match(adtHost, "[a-z0-9.]+").Success)
      {
        _log.LogWarning($"Request received for {req.Path} with invalid host header {adtHost}");
        return new RequestProcessorResult(false, null, $"Invalid {Constants.AdtHostHeaderName} header");
      }

      return new RequestProcessorResult(true, new RequestContext(adtHost), null);
    }

    private bool TryGetAdtHostHeader(HttpRequest req, out StringValues value)
    {
      if (req.Headers.TryGetValue(Constants.AdtHostHeaderName, out value))
      {
        return true;
      }

      if (req.Query.TryGetValue(Constants.AdtHostHeaderName, out value))
      {
        return true;
      }

      value = default(StringValues);
      return false;
    }
  }
}
