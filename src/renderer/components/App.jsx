import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import 'popper.js';
import 'bootstrap';

import Dashboard from './Dashboard';
import AppLoading from './AppLoading';
// app styling
import '~/src/resources/scss/main.scss'; // eslint-disable-line import/no-unresolved

window.$ = window.jQuery = require('jquery'); // eslint-disable-line no-multi-assign

class App extends React.Component {
  state = {
    completedChecks: false,
  };

  completeChecks = () => {
    this.setState({ completedChecks: true });
  };

  render() {
    return (
      <HashRouter>
        <Switch>
          <Route
            render={routeProps => {
              if (this.state.completedChecks) {
                return <Dashboard {...routeProps} />;
              }
              return (
                <AppLoading
                  {...routeProps}
                  completedChecks={this.state.completedChecks}
                  completeChecks={this.completeChecks}
                />
              );
            }}
          />
        </Switch>
      </HashRouter>
    );
  }
}

export default App;
