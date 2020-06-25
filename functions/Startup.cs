// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System.Net.Http;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AdtExplorer.Functions.Configuration;
using AdtExplorer.Functions.Utilities;

[assembly: FunctionsStartup(typeof(AdtExplorer.Functions.Startup))]

namespace AdtExplorer.Functions
{
  public class Startup : FunctionsStartup
  {
    public override void Configure(IFunctionsHostBuilder builder)
    {
      builder.Services
        .AddHttpClient("ProxyKitClient")
        .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
        {
          AllowAutoRedirect = false,
          UseCookies = false
        });

      builder.Services.AddOptions<EndpointOptions>()
        .Configure<IConfiguration>((settings, configuration) => configuration.GetSection("EndpointOptions").Bind(settings));
      builder.Services.AddOptions<SecurityOptions>()
        .Configure<IConfiguration>((settings, configuration) => configuration.GetSection("SecurityOptions").Bind(settings));

      builder.Services.AddSingleton<IEndpointService, EndpointService>();
      builder.Services.AddSingleton<IRequestProcessor, RequestProcessor>();
    }
  }
}
