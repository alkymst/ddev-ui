import React from 'react';
import { Window } from 'react-desktop/macOs';
import _ from 'lodash';
import { toast } from 'react-toastify';
import ErrorBoundary from 'react-error-boundary';

// components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ViewRouter from './ViewRouter';
import Alpha from './Alpha';
import Alerts from './Alerts';
import Status from './Status';

// non componentized JS
import { updateDistros } from '../distro-updater';
import { list } from '../ddev-shell';

class Dashboard extends React.Component {
  state = {
    projects: {},
    errors: {},
    router: 'Not Running - No Running DDEV Applications.',
  };

  componentDidMount() {
    // update the CMS distros
    updateDistros();
    // Initial state load
    this.fetchProjects();
    // Set heartbeat to check for updates
    // TODO: Work with local team to refine `ddev list -j --continuous` and start using that instead
    this.timerID = setInterval(() => this.heartBeat(), 2500); // 2.5s
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  fetchProjects = () => {
    list()
      .then(newProjects => {
        const projects = {};
        Object.keys(newProjects).forEach(key => {
          if (Object.prototype.hasOwnProperty.call(newProjects, key)) {
            projects[newProjects[key].name] = newProjects[key];
          }
        });
        this.updateProjects(projects);
        this.updateRouterStatus(projects);
        this.errorResolve();
      })
      .catch(e => {
        this.errorCapture(e);
      });
  };

  updateProjects = projects => {
    if (JSON.stringify(this.state.projects) !== JSON.stringify(projects)) {
      this.setState({ projects });
    }
  };

  updateRouterStatus = projects => {
    let routerStatusText = 'Not Running - No Running DDEV Applications.';
    const validRouterStates = ['starting', 'healthy'];
    const routerStatus = _.isSet(Object.values(projects)[0].router_status)
      ? Object.values(projects)[0].router_status
      : -1;

    routerStatusText =
      validRouterStates.indexOf(routerStatus) !== -1
        ? _.upperFirst(routerStatus)
        : routerStatusText;

    if (this.state.router !== routerStatusText) {
      this.setState({ router: routerStatusText });
    }
  };

  heartBeat = () => {
    this.fetchProjects();
  };

  errorCapture = (e, info) => {
    let error = {};

    try {
      error = JSON.parse(e);
    } catch (err) {
      console.log(err);
    }

    let {
      msg = ' 🦄 There was a problem!',
      level = 'info',
      type = 'general',
      time = Date.now(),
      id = Date.now(),
    } = error;

    // Docker error
    if (msg.includes('Docker')) {
      msg = ` 🐳 ${msg}`;
      type = 'docker';
      id = 'docker';
    }

    if (_.isUndefined(_.find(this.state.errors, ['id', id]))) {
      // set to state to check against
      this.setState(prevState => {
        const { errors } = prevState;

        if (_.isUndefined(_.find(errors, id))) {
          // console.log(errors);
          errors[id] = { msg, info, id, level, type, time };

          // log error for now
          console.table({ msg, info, id, level, type, time });

          // update state
          return { errors };
        }
      });
    }
  };

  errorResolve = () => {
    if (_.find(this.state.errors, e => e.id === 'docker')) {
      this.setState(prevState => {
        const { errors } = prevState;
        const nonDockerErrors = _.find(errors, e => e.id !== 'docker');
        if (toast.isActive('docker')) {
          toast.dismiss('docker');
        }
        if (_.isUndefined(nonDockerErrors)) {
          return { errors: {} };
        }
        return { errors: nonDockerErrors };
      });
    }
  };

  errorRemove = id => {
    if (_.find(this.state.errors, e => !_.isUndefined(e) && !_.isUndefined(e.id) && e.id === id)) {
      this.setState(prevState => {
        const { errors } = prevState;
        const otherErrors = _.find(errors, e => e.id !== id);
        if (_.isUndefined(otherErrors)) {
          return { errors: {} };
        }
        return { errors: otherErrors };
      });
    }
  };

  render() {
    return (
      <Window chrome padding="0px" className="Window">
        <ErrorBoundary onError={this.errorCapture}>
          <Header {...this.props} />
        </ErrorBoundary>
        <section className="app-container container-fluid">
          <div className="row h-100">
            <ErrorBoundary onError={this.errorCapture}>
              <Sidebar projects={this.state.projects} />
            </ErrorBoundary>
            <ErrorBoundary onError={this.errorCapture}>
              <main className="content h-100 col-md-8">
                <Status />
                <Alpha />
                <Alerts errorRemove={this.errorRemove} errors={this.state.errors} />
                <ViewRouter projects={this.state.projects} />
              </main>
            </ErrorBoundary>
          </div>
        </section>
        <ErrorBoundary onError={this.errorCapture}>
          <Footer projects={this.state.projects} router={this.state.router} />
        </ErrorBoundary>
      </Window>
    );
  }
}

export default Dashboard;
