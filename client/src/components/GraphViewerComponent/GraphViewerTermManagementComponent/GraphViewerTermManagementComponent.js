import React, { Component } from "react";
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

export default class GraphViewerTermManagementComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterTerm: ""
    };
    this.menuItems = [
      {
        key: "addOutgoingRelationships",
        text: "Add Outgoing Relationships",
        ariaLabel: "add outgoing relationships"
      }
    ];
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
        addOutgoingRelationships: true,
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

  toggleCheckbox = (term, key) => {
    const { terms, onUpdateTerm } = this.props;
    const newTerms = [ ...terms ];
    newTerms.forEach(t => {
      if (t.text === term.text) {
        t[key] = !t[key];
        if (onUpdateTerm) {
          onUpdateTerm(t);
        }
      }
    });
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

  render() {
    const { filterTerm } = this.state;
    const { terms } = this.props;
    return (
      <Label className="highlight-section">
        <div className="filter-input">
          <div className="gv-filter-wrap">
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
                  ariaLabel={term.text}
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
                      ariaLabel="toggle term options menu"
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
                        <div className="term-menu-item" key={item.key} aria-label={item.ariaLabel}>
                          <Checkbox checked={term[item.key] === true} onChange={() => this.toggleCheckbox(term, item.key)} />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>}
                  </div>
                  <IconButton
                    onClick={() => this.removeTerm(term)}
                    ariaLabel="remove filtering term"
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
