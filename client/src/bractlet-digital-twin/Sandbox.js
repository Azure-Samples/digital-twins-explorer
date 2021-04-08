import React from "react";

import "./sandbox.scss";

import { apiService } from "../services/ApiService";
import { Schedule } from "./Schedule";

export class Sandbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ahuSchedule: [],
    };

    this.getAHUs = this.getAHUs.bind(this);
    this.getRelationshipsRecursively = this.getRelationshipsRecursively.bind(
      this
    );
  }

  async getRelationshipsRecursively(twins) {
    for (let index = 0; index < twins.length; index++) {
      const twin = twins[index];
      const hasParts = await apiService.queryTwins(
        `SELECT T, CT FROM DIGITALTWINS T JOIN CT RELATED T.hasPart WHERE T.$dtId = '${
          twin.$dtId
        }'`
      );

      if (hasParts.length === 0) {
        return;
      } else {
        const twinParts = hasParts.filter(
          (hasPart) => hasPart.$dtId !== twin.$dtId
        );
        twin.hasPart = twinParts;
        await this.getRelationshipsRecursively(twinParts);
      }
    }

    return twins;
  }

  async getAHUs() {
    const ahus = await apiService.queryTwins(
      "SELECT * FROM DIGITALTWINS DT WHERE IS_OF_MODEL(DT,'dtmi:brick:v1_2_0:Air_Handling_Unit;2')"
    );
    const returnedAHUs = await this.getRelationshipsRecursively(ahus);

    this.setState({ ahuSchedule: returnedAHUs });
  }

  render() {
    return (
      <div className="equipment-schedule--wrapper">
        <h3 className="equipment-schedule--title">
          Air Handling Unit Schedule
        </h3>
        <button className="query-button" onClick={this.getAHUs}>
          Generate AHU Schedule
        </button>
        {this.state.ahuSchedule.length > 0 ? (
          <Schedule ahuSchedule={this.state.ahuSchedule} />
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default Sandbox;
