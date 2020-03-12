import React, { Component } from 'react';
import PropTypes from 'prop-types';
import once from 'lodash/once';
import { omitBy, isNil } from 'lodash/fp';
import uuid from 'uuid';

class OTPublisher extends Component {
  constructor(props, context) {
    super(props);

    this.state = {
      publisher: null,
      lastStreamId: '',
      session: props.session || context.session || null
    };
  }

  componentDidMount() {
    this.createPublisher();
  }

  componentDidUpdate(prevProps, prevState) {
    const useDefault = (value, defaultValue) => (
      value === undefined ? defaultValue : value
    );

    const shouldUpdate = (key, defaultValue) => {
      const previous = useDefault(
        prevProps.properties[key], 
        defaultValue
      );
      const current = useDefault(
        this.props.properties[key], 
        defaultValue
      );

      return previous !== current;
    };

    const updatePublisherProperty = (key, defaultValue) => {
      if (shouldUpdate(key, defaultValue)) {
        const value = useDefault(
          this.props.properties[key],
          defaultValue
        );
        
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

    if (this.state.session !== prevState.session) {
      this.destroyPublisher(prevState.session);
      this.createPublisher();
    }
  }

  // NOTE: This may not be included in the lifecycle
  // methods.
  componentWillUnmount() {
    if (this.state.session) {
      this.state.session.off(
        'sessionConnected', 
        this.sessionConnectedHandler
      );
    }

    this.destroyPublisher();
  }

  getPublisher() {
    return this.state.publisher;
  }

  destroyPublisher(session = this.state.session) {
    delete this.publisherId;

    if (this.state.publisher) {
      this.state.publisher.off(
        'streamCreated',
        this.streamCreatedHandler
      );

      if (this.props.eventHandlers &&
        typeof this.props.eventHandlers === 'object') {
          this.state.publisher.once(
            'destroyed',
            () => { 
              this.state.publisher.off(
                this.props.eventHandlers
              ) 
            }
          ); 
      }

      if (session) {
        session.unpublish(this.state.publisher);
      }

      this.state.publisher.destroy();
    }
  }

  publishToSession(publisher) {
    const { publisherId } = this;

    this.state.session.publish(publisher, err => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the 
        // component unounted so don't invoke any callbacks.
      }

      if (err) {
        this.handleError(err);
      } else if (typeof this.props.onPublish === 'function') {
        this.props.onPublish();
      }
    });
  }

  // TODO: This function is pretty long, create more methods
  createPublisher() {
    if (!this.state.session) {
      this.setState({ publisher: null, lastStreamId: '' });
      return;
    }

    const properties = this.props.properties || {};
    let container;

    // NOTE: If the insert mode is append, the default value setting
    // for the video will be used.
    // 
    // insertMode = 'append': The video element will be rendered after
    // the OTPublisherContainer, having the default width and height.
    //
    // insertMode = undefined: The video element will be the 
    // OTPublisherContainer, accepting the width and height properties 
    // given to it.
    if (properties.insertMode === 'append' && 
      properties.width && 
      properties.height) {
        // Using defined settings
        container = document.createElement('div');
        container.setAttribute('class', 'OTPublisherContainer');
        container.style.setProperty('width', properties.width);
        container.style.setProperty('height', properties.height);
        this.node.appendChild(container);
    } else {
      // This is a default setting.
      // The width is 264 pixels and the height is 198 pixels.
      // https://tokbox.com/developer/guides/customize-ui/js/
      container = document.createElement('div');
      container.setAttribute('class', 'OTPublisherContainer');
      this.node.appendChild(container);
    }

    this.publisherId = uuid();
    const { publisherId } = this;

    this.errorHandler = once(err => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the
        // component unmounted so don't invoke any callbacks.
        return;
      }

      if (typeof this.props.onError === 'function') {
        this.props.onError(err);
      }
    });

    // A document element is passed in.
    // TODO: Handle ids?  
    const publisher = OT.initPublisher(container, properties, err => {
      if (publisherId !== this.publisherId) {
        // Either this publisher has been recreated or the
        // component unmounted so don't invoke any callbacks.
        return;
      }

      if (err) {
        this.handleError(err);
      } else if (typeof this.props.onInit === 'function') {
        this.props.onInit();
      }
    });

    publisher.on('streamCreated', this.streamCreatedHandler);

    if (this.props.eventHandlers && 
      typeof this.props.eventHandlers === 'object') {
        const handles = omitBy(isNil)(this.props.eventHandlers);
        publisher.on(handlers);
    }

    if (this.state.session.connection) {
      this.publishToSession(publisher);
    } else {
      this.state.session.once(
        'sessionConnected', 
        this.sessionConnectedHandler
      );
    }

    this.setState({ publisher, lastStreamId: '' });
  }

  sessionConnectHandler = () => {
    this.publishToSession(this.state.publisher);
  };

  streamCreatedHandler = event => {
    this.setState({ lastStreamId: event.stream.id });
  }

  render() {
    // TODO: This component does not render children elements. Would there be a scenario where this is wanted? Such as button styling, etc.?
    return (
      <div 
        className={this.props.className}
        style={this.props.style}
        // NOTE: If an id is referenced, there would probably be no 
        // need for this ref.
        ref={(node) => { this.node = node; }}
      />
    );
  }
}

OTPublisher.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  session: PropTypes.shape({
    connection: PropTypes.shape({
      connectionId: PropTypes.string
    }),
    once: PropTypes.func,
    off: PropTypes.func,
    publish: PropTypes.func,
    unpublish: PropTypes.func
  }),
  properties: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  eventHandlers: PropTypes.objectOf(PropTypes.func),
  onInit: PropTypes.func,
  onPublish: PropTypes.func,
  onError: PropTypes.func
};

OTPublisher.defaultProps = {
  session: null,
  properties: {},
  eventHandlers: null,
  onInit: null,
  onPublish: null,
  onError: null
};

OTPublisher.contextTypes = {
  session: PropTypes.shape({
    connection: PropTypes.shape({
      connectionId: PropTypes.string
    }),
    once: PropTypes.func,
    off: PropTypes.func,
    publish: PropTypes.func,
    unpublish: PropTypes.func
  })
};

export default OTPublisher;
