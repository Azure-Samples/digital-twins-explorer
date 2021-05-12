import React from "react";
import NumberFormat from "react-number-format";

function ScheduleRow(props) {
  return (
    <tr>
      <td>{props.ahu.$dtId}</td>
      <td>
        <NumberFormat
          value={props.ahu.design_flow_rate}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={0}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.design_outdoor_air_flow_rate}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={0}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[0].hasPart[0].motor_power}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={0}
        />
      </td>
      <td>
        {
          (props.ahu.hasPart[0].hasPart[0].hasPart[0].$metadata.$model = "dtmi:brick:v1_2_0:Fan_VFD;2"
            ? "TRUE"
            : "FALSE")
        }
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].grand_sensible_energy}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={0}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].total_energy}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={0}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].entering_air_temperature}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={1}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].leaving_air_temperature}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={1}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].entering_water_temperature}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={1}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].leaving_water_temperature}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={1}
        />
      </td>
      <td>
        <NumberFormat
          value={props.ahu.hasPart[1].water_flow_rate}
          displayType={"text"}
          thousandSeparator={true}
          decimalScale={2}
        />
      </td>
    </tr>
  );
}

export class Schedule extends React.Component {
  render() {
    let rows = this.props.ahuSchedule.map((ahu) => {
      return <ScheduleRow key={ahu.$dtId} ahu={ahu} />;
    });

    return (
      <table>
        <thead>
          <tr>
            <th colSpan="3">AHU</th>
            <th colSpan="2">Fan</th>
            <th colSpan="7">Cooling Coil</th>
          </tr>
          <tr>
            <th>AHU Name</th>
            <th>Design Flow Rate</th>
            <th>Design Outdoor Air Flow Rate</th>
            <th>Motor HP</th>
            <th>VFD</th>
            <th>Grand Sensible Energy</th>
            <th>Total Energy</th>
            <th>Entering Air Temperature</th>
            <th>Leaving Air Temperature</th>
            <th>Entering Water Temperature</th>
            <th>Leaving Water Temperature</th>
            <th>Water Flow Rate</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

export default Schedule;
