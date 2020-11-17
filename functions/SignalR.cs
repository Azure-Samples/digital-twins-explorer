// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using AdtExplorer.Functions.Utilities;

namespace AdtExplorer.Functions
{
  public class SignalR
  {
    private readonly IRequestProcessor _requestProcessor;
    private readonly IEndpointService _endpointService;
    private readonly ILogger<SignalR> _log;

    public SignalR(IRequestProcessor requestProcessor, IEndpointService endpointService, ILogger<SignalR> log)
    {
      _requestProcessor = requestProcessor;
      _endpointService = endpointService;
      _log = log;
    }

    [FunctionName("signalr")]
    public async Task<HttpResponseMessage> Run(
      [HttpTrigger(AuthorizationLevel.Anonymous, "POST", Route = "signalr/negotiate")] HttpRequest req,
      IBinder binder)
    {
      var rpr = _requestProcessor.Process(req);
      if (!rpr.IsSuccess)
      {
        return HttpUtilities.BadRequest(rpr.Message);
      }

      await SetupEndpointAsync(rpr.Context.InstanceName);
      await SetupRouteAsync(rpr.Context);

      var hubName = EndpointService.EncodeInstanceNameForSignalR(rpr.Context.InstanceName);
      var connectionInfo = binder.Bind<SignalRConnectionInfo>(
        new SignalRConnectionInfoAttribute
        {
          HubName = hubName,
          UserId = Guid.NewGuid().ToString()
        });

      _log.LogInformation($"Negotiated connection to {hubName}");
      return HttpUtilities.Ok(connectionInfo);
    }

    private async Task SetupEndpointAsync(string instanceName)
    {
      try
      {
        await _endpointService.CreateEndpointAsync(instanceName);
      }
      catch (Exception e)
      {
        _log.LogWarning($"Failed to setup endpoint, manual steps required: {e}");
      }
    }

    private async Task SetupRouteAsync(RequestContext context)
    {
      try
      {
        await _endpointService.CreateRouteAsync(context);
      }
      catch (Exception e)
      {
        _log.LogWarning($"Failed to setup route, manual steps required: {e}");
      }
    }
  }
}
