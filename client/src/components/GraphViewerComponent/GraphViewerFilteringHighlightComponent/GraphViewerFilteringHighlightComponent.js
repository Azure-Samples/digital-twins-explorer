import React, { Component } from "react";
import { eventService } from "../../../services/EventService";
import { IconButton, Label, TextField, Toggle, Checkbox } from "office-ui-fabric-react";

const addIconStyle = {
  background: "#0078d4",
  padding: 4,
  height: 12,
  width: 12,
  lineHeight: "12px",
  fontSize: 12,
  borderRadius: "50%",
  cursor: "pointer"
};

export default class GraphViewerFilteringHighlightComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterTerm: "",
      matchDtmi: true,
      matchDisplayName: true,
      matchTerms: []
    };
  }

  componentDidMount() {
    eventService.subscribeEnvironmentChange(this.clearAfterEnvironmentChange);
  }

  componentWillUnmount() {
    eventService.unsubscribeEnvironmentChange(this.clearAfterEnvironmentChange);
  }

  clearAfterEnvironmentChange = () => {
    this.setState({
      filterTerm: "",
      matchDtmi: true,
      matchDisplayName: true,
      matchTerms: []
    });
  }

  onTermChanged = (_, text) => this.setState({ filterTerm: text });

  onMatchDtmi = (ev, checked) => this.setState({ matchDtmi: checked });

  onMatchDisplayName = (ev, checked) =>
    this.setState({ matchDisplayName: checked });

  removeTerm = term => {
    const { matchTerms } = this.state;
    matchTerms.splice(matchTerms.indexOf(term), 1);
    this.setState({ matchTerms });
  };

  addTerm = () => {
    const { filterTerm, matchTerms } = this.state;
    if (filterTerm && !matchTerms.includes(filterTerm)) {
      matchTerms.push(filterTerm);
      this.setState({ matchTerms, filterTerm: "" });
    }
  };

  render() {
    const { matchTerms, filterTerm, matchDtmi, matchDisplayName } = this.state;
    return (
      <Label className="highlight-section">
        <div className="filter-input">
          <div className="mgv-filter-wrap">
            <TextField
              className="mgv-filter"
              onChange={this.onTermChanged}
              placeholder="Match term"
              value={filterTerm}
              iconProps={{
                iconName: "Add",
                style: addIconStyle
              }} />
            <div className="filter-add-hitbox" onClick={this.addTerm} />
          </div>
          <div className="filter-options">
            <Toggle
              className="configuration-input"
              checked={matchDtmi}
              onChange={this.onMatchDtmi}
              label="Match DTMI"
              inlineLabel />
            <Toggle
              className="configuration-input"
              checked={matchDisplayName}
              onChange={this.onMatchDisplayName}
              label="Match DisplayName"
              inlineLabel />
          </div>
        </div>
        <div className="filter-terms">
          {matchTerms.map(term => (
            <div className="filter-term" key={term}>
              <div className="term-bar">
                <span>{term}</span>
                <IconButton
                  onClick={() => this.removeTerm(term)}
                  style={{
                    background: "#084772",
                    height: 20,
                    width: 20
                  }}
                  iconProps={{
                    iconName: "ChromeClose",
                    style: { color: "#fff", fontSize: 12 }
                  }} />
              </div>
              <div className="term-options">
                <Checkbox label="Show Supertypes" />
                <Checkbox label="Show Subtypes" />
              </div>
            </div>
          ))}
        </div>
      </Label>
    );
  }

}
