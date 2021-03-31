// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdtExplorer.Functions.Configuration;
using Azure;
using Azure.DigitalTwins.Core;
using Azure.Identity;
using Microsoft.Azure.Management.DigitalTwins;
using Microsoft.Azure.Management.DigitalTwins.Models;
using Microsoft.Azure.Management.EventGrid;
using Microsoft.Azure.Management.ResourceManager.Fluent.Authentication;
using Microsoft.Azure.Management.Subscription;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AdtExplorer.Functions.Utilities
{
  public interface IEndpointService
  {
    Task CreateEndpointAsync(string instanceName);
    Task CreateRouteAsync(RequestContext context);
  }

  public class EndpointService : IEndpointService
  {
    private const string EndpointId = "webhook";
    private const string RouteId = "webhook-route";
    private readonly EndpointOptions _endpointOptions;
    private readonly ILogger<EndpointService> _log;

    public EndpointService(IOptions<EndpointOptions> endpointOptions, ILogger<EndpointService> log)
    {
      _endpointOptions = endpointOptions.Value;
      _log = log;
    }

    public static string EncodeInstanceNameForSignalR(string instanceName)
    {
      // Azure Digital Twins supports '-' in names but not '_'
      // SignalR supports '_' in hub names but not '-'
      return instanceName.Replace("-", "_");
    }

    public async Task CreateEndpointAsync(string instanceName)
    {
      var creds = GetAzureCredentials();

      var subClient = new SubscriptionClient(creds);
      string nextPageLink = null;
      do
      {
        var subs = nextPageLink == null
          ? await subClient.Subscriptions.ListAsync()
          : await subClient.Subscriptions.ListNextAsync(nextPageLink);
        nextPageLink = subs.NextPageLink;

        foreach (var sub in subs)
        {
          var dtClient = new AzureDigitalTwinsManagementClient(creds);
          dtClient.SubscriptionId = sub.SubscriptionId;

          var instance = await FindDigitalTwinInstanceAsync(dtClient, instanceName);
          if (instance == null)
          {
            _log.LogWarning($"Unable to find instance with name {instanceName} in subscription {sub.SubscriptionId}");
            continue;
          }

          var components = instance.Id.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
          if (components.Length != 8)
          {
            _log.LogWarning($"Unrecognized instance ID format: {instance.Id}");
            continue;
          }

          DigitalTwinsEndpointResource endpoint = null;
          try
          {
            endpoint = await dtClient.DigitalTwinsEndpoint.GetAsync(components[3], instanceName, EndpointId);
          }
          catch (ErrorResponseException e) when (e.Response.StatusCode == HttpStatusCode.NotFound) { }

          if (endpoint == null)
          {
            await CreateNewEndpoint(dtClient, components[1], components[3], instanceName);
          }

          return;
        }
      } while (nextPageLink != null);

      throw new Exception($"Unable to find instance {instanceName}");
    }

    public async Task CreateRouteAsync(RequestContext context)
    {
      var client = new DigitalTwinsClient(new Uri($"https://{context.Host}"), new DefaultAzureCredential());

      EventRoute route = null;
      try
      {
        route = await client.GetEventRouteAsync(RouteId);
      }
      catch (RequestFailedException e) when (e.Status == 404) { }

      if (route == null)
      {
        _log.LogInformation($"Creating route for {context.InstanceName}");
        await client.CreateEventRouteAsync(RouteId, new EventRoute(EndpointId) { Filter = "true" });
      }
    }

    private async Task CreateNewEndpoint(AzureDigitalTwinsManagementClient dtClient, string subscriptionId, string resourceGroup, string instanceName)
    {
      var egClient = new EventGridManagementClient(GetAzureCredentials());
      egClient.SubscriptionId = subscriptionId;

      var topics = await egClient.Topics.ListBySubscriptionAsync($"name eq '{instanceName}'");
      var topic = topics.FirstOrDefault();
      if (topic == null)
      {
        _log.LogError($"Unable to find topic {instanceName} in subscription {subscriptionId}");
        return;
      }

      var topicResourceGroup = topic.Id.Split("/", StringSplitOptions.RemoveEmptyEntries)[3];
      var keys = await egClient.Topics.ListSharedAccessKeysAsync(topicResourceGroup, instanceName);

      _log.LogInformation($"Creating endpoint for {instanceName}");

      await dtClient.DigitalTwinsEndpoint.CreateOrUpdateAsync(resourceGroup, instanceName, EndpointId,
        new Microsoft.Azure.Management.DigitalTwins.Models.EventGrid(topic.Endpoint, keys.Key1, accessKey2: keys.Key2));
    }

    private AzureCredentials GetAzureCredentials()
    {
      return _endpointOptions.UseLocalAuth
        ? new AzureCredentialsFactory().FromFile("../../../azureauth.json")
        : new AzureCredentialsFactory().FromSystemAssignedManagedServiceIdentity(
            MSIResourceType.AppService,
            Microsoft.Azure.Management.ResourceManager.Fluent.AzureEnvironment.AzureGlobalCloud);
    }

    private async Task<DigitalTwinsDescription> FindDigitalTwinInstanceAsync(AzureDigitalTwinsManagementClient dtClient, string instanceName)
    {
      string nextPageLink = null;
      DigitalTwinsDescription match = null;
      do
      {
        var instances = nextPageLink == null
          ? await dtClient.DigitalTwins.ListAsync()
          : await dtClient.DigitalTwins.ListNextAsync(nextPageLink);
        nextPageLink = instances.NextPageLink;

        match = instances.FirstOrDefault(x => string.Equals(x.Name, instanceName, StringComparison.OrdinalIgnoreCase));
        if (match != null)
        {
          break;
        }
      } while (nextPageLink != null);

      return match;
    }
  }
}
