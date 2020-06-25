// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.Rest;
using AdtExplorer.Functions.Configuration;
using AdtExplorer.Functions.Sdk;
using AdtExplorer.Functions.Sdk.Models;

namespace AdtExplorer.Functions.Utilities
{
  public class RequestContext
  {
    public RequestContext(string host, JwtSecurityToken token)
    {
      Host = host;
      Token = token;
    }

    public string Host { get; private set; }
    public string InstanceName => (Host ?? string.Empty).Split(".", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
    public JwtSecurityToken Token { get; private set; }

    public async Task<bool> CheckAccessAsync()
    {
      if (Token == null)
      {
        return false;
      }

      var client = new AzureDigitalTwinsAPIClient(new TokenCredentials(Token.RawData));
      client.BaseUri = new Uri($"https://{Host}/");

      try
      {
        await client.DigitalTwinModels.ListAsync(digitalTwinModelsListOptions: new DigitalTwinModelsListOptions(maxItemCount: 1));
        return true;
      }
      catch (Exception)
      {
        return false;
      }
    }
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
    Task<RequestProcessorResult> ProcessAsync(HttpRequest req);
  }

  public class RequestProcessor : IRequestProcessor
  {
    private const string StsDiscoveryEndpoint = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration";
    private const string ValidAudience = "https://digitaltwins.azure.net";
    private readonly SecurityOptions _securityOptions;
    private readonly ILogger<RequestProcessor> _log;
    private OpenIdConnectConfiguration _validationConfig;

    public RequestProcessor(IOptions<SecurityOptions> securityOptions, ILogger<RequestProcessor> log)
    {
      _securityOptions = securityOptions.Value;
      _log = log;
    }

    public async Task<RequestProcessorResult> ProcessAsync(HttpRequest req)
    {
      if (!TryGetAuthHeader(req.Headers, out var auth))
      {
        _log.LogWarning($"Request received with missing auth header");
        return new RequestProcessorResult(false, null, "Missing auth header");
      }

      var authParts = ((string) auth).Split(" ", StringSplitOptions.RemoveEmptyEntries);
      if (authParts.Length != 2 || string.Equals("Bearer", authParts[1], StringComparison.OrdinalIgnoreCase))
      {
        _log.LogWarning($"Request received with invalid auth header format");
        return new RequestProcessorResult(false, null, "Invalid auth header format");
      }

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

      JwtSecurityToken token;
      try
      {
        token = await ValidateAsync(authParts[1]);
      }
      catch (Exception e)
      {
        _log.LogWarning($"Request received with invalid auth header value: {e}");
        return new RequestProcessorResult(false, null, "Invalid auth header value");
      }

      if (!string.Equals(_securityOptions.AllowedTenant, "*", StringComparison.OrdinalIgnoreCase)
        && !string.Equals($"https://sts.windows.net/{_securityOptions.AllowedTenant}/", token.Issuer, StringComparison.OrdinalIgnoreCase))
      {
        _log.LogWarning($"Request received with unsupported issuer: {token.Issuer}");
        return new RequestProcessorResult(false, null, $"Unsupported issuer");
      }

      if (!string.Equals(_securityOptions.AllowedHosts, "*", StringComparison.OrdinalIgnoreCase)
        && _securityOptions.AllowedHosts.Split(",", StringSplitOptions.RemoveEmptyEntries).All(
          x => !string.Equals(x, adtHost, StringComparison.OrdinalIgnoreCase)))
      {
        _log.LogWarning($"Request received with unsupported host: {adtHost}");
        return new RequestProcessorResult(false, null, $"Unsuppoted host");
      }

      return new RequestProcessorResult(true, new RequestContext(adtHost, token), null);
    }

    private async Task<JwtSecurityToken> ValidateAsync(string token)
    {
      if (_validationConfig == null)
      {
        var configManager = new ConfigurationManager<OpenIdConnectConfiguration>(StsDiscoveryEndpoint,
          new OpenIdConnectConfigurationRetriever());
        _validationConfig = await configManager.GetConfigurationAsync();
      }

      var validationParameters = new TokenValidationParameters
      {
        IssuerSigningKeys = _validationConfig.SigningKeys,
        ValidAudience = ValidAudience,
        ValidateIssuer = false
      };

      var tokenHandler = new JwtSecurityTokenHandler();
      tokenHandler.ValidateToken(token, validationParameters, out var jwt);

      return jwt as JwtSecurityToken;
    }

    private bool TryGetAuthHeader(IHeaderDictionary headers, out StringValues value)
    {
      foreach (var authHeader in Constants.AuthHeaderNames)
      {
        var found = headers.TryGetValue(authHeader, out var result);
        if (found)
        {
          value = result;
          return found;
        }
      }

      value = default(StringValues);
      return false;
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
