// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.EventGrid.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.EventGrid;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AdtExplorer.Functions
{
  public class EventGrid
  {
    private static readonly Dictionary<string, string> EventMappings = new Dictionary<string, string>
    {
      { "microsoft.iot.telemetry", "telemetry" },
      { "microsoft.digitaltwins.twin.update", "twin-update" }
    };

    private readonly ILogger<EventGrid> _log;

    public EventGrid(ILogger<EventGrid> log)
    {
      _log = log;
    }

    [FunctionName("eventgrid")]
    public async Task Run([EventGridTrigger]EventGridEvent eventGridEvent, IBinder binder)
    {
      if (eventGridEvent == null || !EventMappings.TryGetValue(eventGridEvent.EventType.ToLowerInvariant(), out var target))
      {
        _log.LogInformation($"Unrecognized event type: {eventGridEvent?.EventType}, skipping");
        return;
      }

      var dtName = eventGridEvent.Topic.Split("/", StringSplitOptions.RemoveEmptyEntries).Last();
      var dtId = eventGridEvent.Subject;
      var evt = JsonConvert.DeserializeObject<JObject>(eventGridEvent.Data.ToString());
      var data = evt["data"];

      _log.LogInformation($"Received event from {dtName} for {dtId} with content {data.ToString()}");

      var messages = binder.Bind<IAsyncCollector<SignalRMessage>>(
        new SignalRAttribute
        {
          HubName = dtName
        });

      await messages.AddAsync(new SignalRMessage
      {
        Target = target,
        Arguments = new[] { new { dtId, data } }
      });
    }
  }
}
