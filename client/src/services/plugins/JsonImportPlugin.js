// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { readFile } from "../../utils/utilities";

export class JsonImportPlugin {

  async tryLoad(file) {
    if (!file.name.endsWith(".json")) {
      return false;
    }

    const data = await readFile(file);
    if (!data.digitalTwinsFileInfo || data.digitalTwinsFileInfo.fileVersion !== "1.0.0" || !data.digitalTwinsGraph) {
      throw new Error("Unexpected JSON contents");
    }

    return data;
  }

}
