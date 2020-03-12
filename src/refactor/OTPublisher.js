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

  }
}
