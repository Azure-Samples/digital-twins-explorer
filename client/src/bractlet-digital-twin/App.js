import React from "react";
import AdtExplorerApp from "../App.js";
import Sandbox from "./Sandbox.js";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/sandbox">
          <Sandbox />
        </Route>
        <Route path="/">
          <AdtExplorerApp />
        </Route>
      </Switch>
    </Router>
  );
}
export default App;
