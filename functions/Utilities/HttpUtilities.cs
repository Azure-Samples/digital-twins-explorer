// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System.Net;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

namespace AdtExplorer.Functions.Utilities
{
  public static class HttpUtilities
  {
    public static HttpResponseMessage Ok(object content)
    {
      return new HttpResponseMessage(HttpStatusCode.OK)
      {
        Content = new StringContent(JsonConvert.SerializeObject(content), Encoding.UTF8, "application/json")
      };
    }

    public static HttpResponseMessage BadRequest(string message)
    {
      return new HttpResponseMessage(HttpStatusCode.BadRequest)
      {
        Content = new StringContent(JsonConvert.SerializeObject(new { error = message }), Encoding.UTF8, "application/json")
      };
    }
  }
}
