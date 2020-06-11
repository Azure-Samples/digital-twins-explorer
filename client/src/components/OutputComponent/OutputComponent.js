import React from "react";
import { eventService } from "../../services/EventService";
import { print } from "../../services/LoggingService";
import "./OutputComponent.scss";

export class OutputComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { logs: [] };
  }

  componentDidMount() {
    eventService.subscribeLog(data => this.update(data.data, data.type));
    print("**********************************************************", "ok");
    print("*** Welcome to the Azure Digital Twins Demo Playground ***", "ok");
    print("**********************************************************", "ok");
  }

  update = (newdata, newtype) => {
    let newtypeWithFallback = newtype;
    if (newtype !== "error"
      && newtype !== "info"
      && newtype !== "warning"
      && newtype !== "ok") {
      newtypeWithFallback = "info";
    }

    const nlog = {
      data: newdata,
      method: newtypeWithFallback
    };

    this.setState(prevState => ({ logs: [ ...prevState.logs, nlog ] }));
  }

  componentDidUpdate() {
    const objDiv = document.getElementById("oc-scroll");
    if (objDiv) {
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  }

  render() {
    const { logs } = this.state;
    return (
      <div id="oc-scroll" className="oc-output">
        {logs.map((log, i) =>
          <div key={`log-${i}`} className={`oc-${log.method}`}>{log.data}</div>
        )}
      </div>
    );
  }

}
