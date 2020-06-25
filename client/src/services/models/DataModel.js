// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export class DataModel {

  constructor() {
    this.digitalTwinsFileInfo = { fileVersion: "1.0.0" };
    this.digitalTwinsGraph = { digitalTwins: [], relationships: [] };
    this.digitalTwinsModels = [];
  }

}
