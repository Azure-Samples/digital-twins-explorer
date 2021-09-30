import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { IconButton, Label, TextField, Checkbox, Toggle } from "office-ui-fabric-react";

const addIconStyle = {
  padding: 4,
  height: 12,
  width: 12,
  lineHeight: "12px",
  fontSize: 12,
  borderRadius: "50%",
  cursor: "pointer"
};

class GraphViewerTermManagementComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterTerm: ""
    };
    this.menuItems = [
      {
        key: "addOutgoingRelationships",
        text: this.props.t("graphViewerTermManagementComponent.menuItems.text"),
        ariaLabel: this.props.t("graphViewerTermManagementComponent.menuItems.ariaLabel")
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

  keepFocusOnToggle = i => {
    setTimeout(() => {
      let customToggle = document.getElementsByClassName(`${i}--toggle`)[0];
      customToggle = customToggle.children[0];
      customToggle = customToggle.children[0];
      customToggle.focus();
    }, [ 1 ]);
  }

  onTermActiveChange = (term, i) => {
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
    this.keepFocusOnToggle(i);
  }

  render() {
    const { filterTerm } = this.state;
    const { terms, onClearAll, onAction, actionText } = this.props;
    return (
      <>
        <Label className="highlight-section">
          <div className="filter-input">
            <div className="gv-filter-wrap">
              <TextField
                className="mgv-filter"
                onChange={this.onTermChanged}
                onKeyDown={this.handleKeyDown}
                placeholder={this.props.t("graphViewerTermManagementComponent.textFieldPlaceholder")}
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
            {terms.map((term, i) => (
              <div className="filter-term" key={`${term.text}-${term.isActive ? "active" : "inactive"}`}>
                <div className={`term-bar ${term.isActive ? "active" : ""}`}>
                  <Toggle className={`filter-toggle ${i}--toggle`}
                    ariaLabel={term.text}
                    checked={term.isActive} onChange={() => this.onTermActiveChange(term, i)} style={{
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
                        ariaLabel={this.props.t("graphViewerTermManagementComponent.toggleTermsOptions")}
                        style={{
                          height: 22,
                          width: 22
                        }}
                        iconProps={{
                          iconName: "More",
                          style: { color: "#000", fontSize: 12 }
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
                      ariaLabel={this.props.t("graphViewerTermManagementComponent.removeFiltering")}
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
        <div>
          <button className="action-button" type="button" onClick={onClearAll}>{this.props.t("graphViewerTermManagementComponent.clearAll")}</button>
          {actionText && <button className="action-button" type="button" onClick={onAction}>{actionText}</button>}
        </div>
      </>
    );
  }

}

export default withTranslation()(GraphViewerTermManagementComponent);
