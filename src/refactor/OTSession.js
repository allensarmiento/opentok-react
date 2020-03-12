import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Session from '../model/Session';

class OTSession extends Component {
  constructor(props) {
    super(props);

    this.state = { streams: [] };
  }

  getChildContext() {
    return {
      session: this.sessionHelper.getSession(),
      streams: this.state.streams
    };
  }

  // componentWillMount will be deprecated.
  // TODO: Test if this will work in the constructor 
  // instead.
  UNSAFE_componentWillMount() {
    this.createSession();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.apiKey !== this.props.apiKey ||
      prevProps.sessionId !== this.props.sessionId ||
      prevProps.token !== this.props.token) {
        this.createSession();
    }
  }

  // NOTE: This may not be a lifecycle method.
  componentWillUnmount() {
    this.destroySession();
  }

  createSession() {
    this.destroySession();

    this.sessionHelper = new Session({
      apiKey: this.props.apiKey,
      sessionId: this.props.sessionId,
      token: this.props.token,
      onStreamsUpdated: streams => {
        this.setState({ streams });
      },
      onConnect: this.props.onConnect,
      onError: this.props.onError
    });

    if (this.props.eventHandlers && 
      typeof this.props.eventHandlers === 'object') {
        // Set the event handlers to the session.
        const session = this.sessionHelper.getSession();
        session.on(this.props.eventHandlers);
        this.sessionHelper.setSession(session);
    }

    const streams = this.sessionHelper.getStreams();
    this.setState({ streams });
  }

  destroySession() {
    if (this.sessionHelper) {
      if (this.props.eventHandlers &&
        typeof this.props.eventHandlers === 'object') {
          const session = this.sessionHelper.getSession();
          session.off(this.props.eventHandlers);
          this.sessionHelper.setSession(session);
      }
      this.sessionHelper.disconnect();
    }
  }

  render() {
    return (
      <div 
        className={this.props.className}
        style={this.props.style}
      >
        {this.props.children}
      </div>
    );
  }
}

OTSession.propTypes = {
  // children
  className: PropTypes.string,
  style: PropTypes.object,
  apiKey: PropTypes.string.isRequired,
  sessionId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  eventHandlers: PropTypes.objectOf(PropTypes.func),
  onConnect: PropTypes.func,
  onError: PropTypes.func
};

OTSession.defaultProps = {
  eventHandlers: null,
  onConnect: null,
  onError: null
};

OTSession.childContextTypes = {
  streams: PropTypes.arrayOf(PropTypes.object),
  session: PropTypes.shape({
    subscribe: PropTypes.func,
    unsubscribe: PropTypes.func
  })
};

export default OTSession;
