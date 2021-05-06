import React, { Component } from "react";
import { IconButton, Label, TextField, Checkbox, Toggle } from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";
import { eventService } from "../../../services/EventService";

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

class ModelGraphViewerTermManagementComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterTerm: ""
    };
    this.menuItems = [
      {
        key: "addSuperTypes",
        text: this.props.t("modelGraphViewerTermManagementComponent.menuItems.superTypes.text"),
        ariaLabel: this.props.t("modelGraphViewerTermManagementComponent.menuItems.superTypes.ariaLabel")
      },
      {
        key: "addSubTypes",
        text: this.props.t("modelGraphViewerTermManagementComponent.menuItems.addSubTypes.text"),
        ariaLabel: this.props.t("modelGraphViewerTermManagementComponent.menuItems.addSubTypes.ariaLabel")
      },
      {
        key: "addOutgoingRelationships",
        text: this.props.t("modelGraphViewerTermManagementComponent.menuItems.addOutgoingRelationships.text"),
        ariaLabel: this.props.t("modelGraphViewerTermManagementComponent.menuItems.addOutgoingRelationships.ariaLabel")
      },
      {
        key: "matchDtmi",
        text: this.props.t("modelGraphViewerTermManagementComponent.menuItems.matchDtmi.text"),
        ariaLabel: this.props.t("modelGraphViewerTermManagementComponent.menuItems.matchDtmi.ariaLabel")
      },
      {
        key: "matchDisplayName",
        text: this.props.t("modelGraphViewerTermManagementComponent.menuItems.matchDisplayName.text"),
        ariaLabel: this.props.t("modelGraphViewerTermManagementComponent.menuItems.matchDisplayName.ariaLabel")
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
                      ariaLabel={this.props.t("modelGraphViewerTermManagementComponent.termOptions")}
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
                    ariaLabel={this.props.t("modelGraphViewerTermManagementComponent.removeFiltering")}
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

export default withTranslation()(ModelGraphViewerTermManagementComponent);
