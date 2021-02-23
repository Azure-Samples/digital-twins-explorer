import React, { Component } from "react";
import { eventService } from "../../../services/EventService";
import { IconButton, Label, TextField, Checkbox } from "office-ui-fabric-react";

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

export default class ModelGraphViewerTermManagementComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterTerm: "",
      matchTerms: []
    };
    this.menuItems = [
      {
        key: "addSuperTypes",
        text: "Add Supertype",
        ariaLabel: "add supertype"
      },
      {
        key: "addSubTypes",
        text: "Add Subtypes",
        ariaLabel: "add subtypes"
      },
      {
        key: "addOutgoingRelationships",
        text: "Add Outgoing Relationships",
        ariaLabel: "add outgoing relationships"
      },
      {
        key: "matchDtmi",
        text: "Match DTMI",
        ariaLabel: "match dtmi"
      },
      {
        key: "matchDisplayName",
        text: "Match Display Name",
        ariaLabel: "match display name"
      }
    ];
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
      matchTerms: []
    });
  }

  onTermChanged = (_, text) => this.setState({ filterTerm: text });

  removeTerm = term => {
    const { matchTerms } = this.state;
    const { onRemoveFilteringTerm } = this.props;
    matchTerms.splice(matchTerms.map(t => t.text).indexOf(term.text), 1);
    this.setState({ matchTerms });
    if (onRemoveFilteringTerm) {
      onRemoveFilteringTerm(term);
    }
  };

  addTerm = () => {
    const { filterTerm, matchTerms } = this.state;
    const { onAddFilteringTerm } = this.props;
    if (filterTerm && !matchTerms.some(t => t.text === filterTerm)) {
      const term = {
        text: filterTerm,
        menuIsOpen: false,
        matchDtmi: true,
        matchDisplayName: true,
        addSuperTypes: true,
        addSubTypes: true,
        addOutgoingRelationships: true
      };
      if (onAddFilteringTerm) {
        onAddFilteringTerm(term);
      }
      matchTerms.push(term);
      this.setState({ matchTerms, filterTerm: "" });
    }
  };

  toggleTermOptions = term => {
    const { matchTerms } = this.state;
    if (!term.menuIsOpen) {
      matchTerms.forEach(t => {
        t.menuIsOpen = false;
      });
    }
    matchTerms[matchTerms.map(t => t.text).indexOf(term.text)].menuIsOpen = !term.menuIsOpen;
    this.setState({ matchTerms });
  }

  handleKeyDown = e => {
    if (e.key === "Enter") {
      this.addTerm();
    }
  }

  toggleCheckbox = (term, key) => {
    const { matchTerms } = this.state;
    const { onUpdateTerm } = this.props;
    matchTerms.forEach(t => {
      if (t.text === term.text) {
        t[key] = !t[key];
        if (onUpdateTerm) {
          onUpdateTerm(t);
        }
      }
    });
    this.setState({ matchTerms });
  }

  render() {
    const { matchTerms, filterTerm } = this.state;
    return (
      <Label className="highlight-section">
        <div className="filter-input">
          <div className="mgv-filter-wrap">
            <TextField
              className="mgv-filter"
              onChange={this.onTermChanged}
              onKeyDown={this.handleKeyDown}
              placeholder="Match term"
              value={filterTerm}
              iconProps={{
                iconName: "Add",
                style: addIconStyle
              }} />
            <div className="filter-add-hitbox" onClick={this.addTerm} />
          </div>
        </div>
        <div className="filter-terms">
          {matchTerms.map(term => (
            <div className="filter-term" key={term.text}>
              <div className="term-bar">
                <span>{term.text}</span>
                <div className="filter-buttons">
                  <div className="term-options">
                    <IconButton
                      onClick={() => this.toggleTermOptions(term)}
                      className="more-icon"
                      style={{
                        height: 22,
                        width: 22
                      }}
                      iconProps={{
                        iconName: "More",
                        style: { color: "#fff", fontSize: 12 }
                      }} />
                    {term.menuIsOpen && <div className="term-menu">
                      {this.menuItems.map(item => (
                        <div className="term-menu-item" key={item.key} ariaLabel={item.ariaLabel}>
                          <Checkbox checked={term[item.key] === true} onChange={() => this.toggleCheckbox(term, item.key)} />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>}
                  </div>
                  <IconButton
                    onClick={() => this.removeTerm(term)}
                    style={{
                      background: "#084772",
                      height: 22,
                      width: 22
                    }}
                    iconProps={{
                      iconName: "ChromeClose",
                      style: { color: "#fff", fontSize: 12 }
                    }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Label>
    );
  }

}
