// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdtExplorer.Functions.Configuration;
using AdtExplorer.Functions.Sdk;
using Microsoft.Azure.Management.EventGrid;
using Microsoft.Azure.Management.ResourceManager.Fluent;
using Microsoft.Azure.Management.ResourceManager.Fluent.Authentication;
using Microsoft.Azure.Management.ResourceManager.Fluent.GenericResource.Definition;
using Microsoft.Azure.Management.ResourceManager.Fluent.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Rest;
using Microsoft.Rest.Azure.OData;

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

    public async Task CreateEndpointAsync(string instanceName)
    {
      var auth = GetAzureResourceManagerClient();
      var subs = await auth.Subscriptions.ListAsync();
      do
      {
        GenericResourceInner match = null;
        foreach (var sub in subs)
        {
          var rm = auth.WithSubscription(sub.SubscriptionId);
          var results = await rm.Inner.Resources.ListAsync(
            new ODataQuery<GenericResourceFilter>(
              $"resourceType eq 'Microsoft.DigitalTwins/digitaltwinsinstances' and name eq '{instanceName}'"));

          match = results.FirstOrDefault();
          if (match != null)
          {
            _log.LogInformation($"Found {instanceName}: {match.Id}, creating endpoint");
            var rg = match.Id.Split("/", StringSplitOptions.RemoveEmptyEntries)[3];
            var endpoint = await GetNewEndpoint(rm, instanceName, rg, sub.SubscriptionId);
            await rm.GenericResources.CreateAsync(new[] { endpoint });
            break;
          }
        }

        if (match != null)
        {
          break;
        }

        subs = await subs.GetNextPageAsync();
      } while (subs != null);
    }

    public async Task CreateRouteAsync(RequestContext context)
    {
      var client = new AzureDigitalTwinsAPIClient(new TokenCredentials(context.Token.RawData));
      client.BaseUri = new Uri($"https://{context.Host}/");

      _log.LogInformation($"Creating route for {context.InstanceName}");
      await client.EventRoutes.AddAsync(RouteId, new Sdk.Models.EventRoute(EndpointId, filter: "true"));
    }

    private ResourceManager.IAuthenticated GetAzureResourceManagerClient()
    {
      var credentials = GetAzureCredentials();
      return ResourceManager
        .Configure()
        .Authenticate(credentials);
    }

    private async Task<IWithCreate> GetNewEndpoint(IResourceManager rm, string instanceName, string resourceGroup, string subscriptionId)
    {
      var client = GetEventGridManagementClient();
      client.SubscriptionId = subscriptionId;

      var topics = await client.Topics.ListBySubscriptionAsync($"name eq '{instanceName}'");
      var topic = topics.FirstOrDefault();
      if (topic == null)
      {
        throw new Exception($"Unable to find topic {instanceName} in subscription {subscriptionId}");
      }

      var topicResourceGroup = topic.Id.Split("/", StringSplitOptions.RemoveEmptyEntries)[3];
      var keys = await client.Topics.ListSharedAccessKeysAsync(topicResourceGroup, instanceName);

      return rm.GenericResources.Define(EndpointId)
        .WithRegion((string)null)
        .WithExistingResourceGroup(resourceGroup)
        .WithResourceType("endpoints")
        .WithProviderNamespace("Microsoft.DigitalTwins/digitaltwinsinstances")
        .WithoutPlan()
        .WithApiVersion("2020-03-01-preview")
        .WithParentResource(instanceName)
        .WithProperties(
          new Dictionary<string, object>
          {
            {"TopicEndpoint", topic.Endpoint},
            {"endpointType", "EventGrid"},
            {"accessKey1", keys.Key1},
            {"accessKey2", keys.Key2}
          });
    }

    private EventGridManagementClient GetEventGridManagementClient()
    {
      var credentials = GetAzureCredentials();
      return new EventGridManagementClient(credentials);
    }

    private AzureCredentials GetAzureCredentials()
    {
      return _endpointOptions.UseLocalAuth
        ? new AzureCredentialsFactory().FromFile("../../azureauth.json")
        : new AzureCredentialsFactory().FromSystemAssignedManagedServiceIdentity(MSIResourceType.AppService, AzureEnvironment.AzureGlobalCloud);
    }
  }
}
