import React, { Component } from 'react';
import PropTypes from 'prop-types';
import once from 'lodash/once';
import { omitBy, isNil } from 'lodash/fp';
import uuid from 'uuid';

export default class OTPublisher extends Component {
  constructor(props) {
    super(props);

    this.state = {
      publisher: null,
      lastStreamId: '',
    };
  }

  componentDidMount() {
    this.createPublisher();
  }

  componentDidUpdate(prevProps) {
    const useDefault = (value, defaultValue) => (value === undefined ? defaultValue : value);

    const shouldUpdate = (key, defaultValue) => {
      const previous = useDefault(prevProps.properties[key], defaultValue);
      const current = useDefault(this.props.properties[key], defaultValue);
      return previous !== current;
    };

    const updatePublisherProperty = (key, defaultValue) => {
      if (shouldUpdate(key, defaultValue)) {
        const value = useDefault(this.props.properties[key], defaultValue);
        this.state.publisher[key](value);
      }
    };

    if (shouldUpdate('videoSource', undefined)) {
      this.destroyPublisher();
      this.createPublisher();
      return;
    }

    updatePublisherProperty('publishAudio', true);
    updatePublisherProperty('publishVideo', true);

    if (this.props.session !== prevProps.session) {
      this.destroyPublisher(prevProps.session);
      this.createPublisher();
    }
  }

  componentWillUnmount() {
    if (this.props.session) {
      this.props.session.off('sessionConnected', this.sessionConnectedHandler);
    }

    this.destroyPublisher();
  }

  getPublisher() {
    return this.state.publisher;
  }

  destroyPublisher(session = this.props.session) {
    delete this.publisherId;

    if (this.state.publisher) {
      this.state.publisher.off('streamCreated', this.streamCreatedHandler);

      if (
        this.props.eventHandlers &&
        typeof this.props.eventHandlers === 'object'
      ) {
        this.state.publisher.once('destroyed', () => {
          this.state.publisher.off(this.props.eventHandlers);
        });
      }

      if (session) {
        session.unpublish(this.state.publisher);
      }
      this.state.publisher.destroy();
    }
  }

  publishToSession(publisher) {
    const { publisherId } = this;

    this.props.session.publish(publisher, (err) => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the
        // component unmounted so don't invoke any callbacks
        return;
      }
      if (err) {
        this.errorHandler(err);
      } else if (typeof this.props.onPublish === 'function') {
        this.props.onPublish();
      }
    });
  }

  createPublisher() {
    if (!this.props.session) {
      this.setState({ publisher: null, lastStreamId: '' });
      return;
    }

    const properties = this.props.properties || {};
    let container;

    if (properties.insertDefaultUI !== false) {
      container = document.createElement('div');
      container.setAttribute('class', 'OTPublisherContainer');
      this.node.appendChild(container);
    }

    this.publisherId = uuid();
    const { publisherId } = this;

    this.errorHandler = once((err) => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the
        // component unmounted so don't invoke any callbacks
        return;
      }
      if (typeof this.props.onError === 'function') {
        this.props.onError(err);
      }
    });

    const publisher = OT.initPublisher(container, properties, (err) => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the
        // component unmounted so don't invoke any callbacks
        return;
      }
      if (err) {
        this.errorHandler(err);
      } else if (typeof this.props.onInit === 'function') {
        this.props.onInit();
      }
    });
    publisher.on('streamCreated', this.streamCreatedHandler);

    if (
      this.props.eventHandlers &&
      typeof this.props.eventHandlers === 'object'
    ) {
      const handles = omitBy(isNil)(this.props.eventHandlers);
      publisher.on(handles);
    }

    if (this.props.session.connection) {
      this.publishToSession(publisher);
    } else {
      this.props.session.once('sessionConnected', this.sessionConnectedHandler);
    }

    this.setState({ publisher, lastStreamId: '' });
  }

  sessionConnectedHandler = () => {
    this.publishToSession(this.state.publisher);
  }

  streamCreatedHandler = (event) => {
    this.setState({ lastStreamId: event.stream.id });
  }

  render() {
    return <div ref={node => (this.node = node)} />;
  }
}

OTPublisher.propTypes = {
  session: PropTypes.shape({
    connection: PropTypes.shape({
      connectionId: PropTypes.string,
    }),
    once: PropTypes.func,
    off: PropTypes.func,
    publish: PropTypes.func,
    unpublish: PropTypes.func,
  }),
  properties: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  eventHandlers: PropTypes.objectOf(PropTypes.func),
  onInit: PropTypes.func,
  onPublish: PropTypes.func,
  onError: PropTypes.func,
};

OTPublisher.defaultProps = {
  session: null,
  properties: {},
  eventHandlers: null,
  onInit: null,
  onPublish: null,
  onError: null,
};
