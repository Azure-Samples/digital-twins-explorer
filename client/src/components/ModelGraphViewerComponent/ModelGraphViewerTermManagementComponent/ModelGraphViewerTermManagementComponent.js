import React, { Component } from "react";
import { eventService } from "../../../services/EventService";
import { IconButton, Label, TextField, Checkbox, Toggle } from "office-ui-fabric-react";

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
      filterTerm: ""
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
      filterTerm: ""
    });
  }

  onTermChanged = (_, text) => this.setState({ filterTerm: text });

  removeTerm = term => {
    const { onRemoveFilteringTerm } = this.props;
    if (onRemoveFilteringTerm) {
      onRemoveFilteringTerm(term);
    }
  };

  addTerm = () => {
    const { filterTerm } = this.state;
    const { terms, onAddFilteringTerm } = this.props;
    if (filterTerm && !terms.some(t => t.text === filterTerm)) {
      const term = {
        text: filterTerm,
        menuIsOpen: false,
        matchDtmi: true,
        matchDisplayName: true,
        addSuperTypes: false,
        addSubTypes: false,
        addOutgoingRelationships: false,
        isActive: true
      };
      if (onAddFilteringTerm) {
        onAddFilteringTerm(term);
      }
      this.setState({ filterTerm: "" });
    }
  };

  toggleTermOptions = term => {
    const { terms, onUpdateTerm } = this.props;
    const newTerms = [ ...terms ];
    if (!term.menuIsOpen) {
      newTerms.forEach(t => {
        t.menuIsOpen = false;
      });
    }
    newTerms[newTerms.map(t => t.text).indexOf(term.text)].menuIsOpen = !term.menuIsOpen;
    newTerms.forEach(t => {
      onUpdateTerm(t);
    });
  }

  handleKeyDown = e => {
    if (e.key === "Enter") {
      this.addTerm();
    }
  }

  onTermActiveChange = term => {
    const { terms, onUpdateTerm } = this.props;
    const newTerms = [ ...terms ];
    newTerms.forEach(t => {
      if (t.text === term.text) {
        t.isActive = !t.isActive;
        if (onUpdateTerm) {
          onUpdateTerm(t);
        }
      }
    });
  }

  toggleCheckbox = (term, key) => {
    const { terms, onUpdateTerm } = this.props;
    terms.forEach(t => {
      if (t.text === term.text) {
        t[key] = !t[key];
        if (onUpdateTerm) {
          onUpdateTerm(t);
        }
      }
    });
  }

  render() {
    const { terms } = this.props;
    const { filterTerm } = this.state;
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
              disabled={terms.length >= 6}
              iconProps={{
                iconName: "Add",
                style: addIconStyle
              }} />
            <div className="filter-add-hitbox" onClick={this.addTerm} />
          </div>
        </div>
        <div className="filter-terms">
          {terms.map(term => (
            <div className="filter-term" key={`${term.text}-${term.isActive ? "active" : "inactive"}`}>
              <div className={`term-bar ${term.isActive ? "active" : ""}`}>
                <Toggle className="filter-toggle"
                  checked={term.isActive} onChange={() => this.onTermActiveChange(term)} style={{
                    marginBottom: 0,
                    height: 12,
                    width: 24
                  }} />
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
                      background: term.isActive ? "#084772" : "#7E7E7E",
                      height: 22,
                      width: 22,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0
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
