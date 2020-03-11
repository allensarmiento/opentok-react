import React, { Component } from 'react';

import { OTSession, OTStreams, OTPublisher, OTSubscriber, preloadScript } from '../../src'
import ConnectionStatus from './ConnectionStatus';
import Publisher from './Publisher';
import Subscriber from './Subscriber';
import config from '../config';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      connected: false
    };

    this.sessionEvents = {
      sessionConnected: () => {
        this.setState({ connected: true });
      },
      sessionDisconnected: () => {
        this.setState({ connected: false });
      }
    };
  }

  componentWillMount() {
    OT.registerScreenSharingExtension('chrome', config.CHROME_EXTENSION_ID, 2);
  }

  onError = (err) => {
    this.setState({ error: `Failed to connect: ${err.message}` });
  }

  render() {
    return (
      <div 
        className='App'
        style={{
          height: '100vh',
          width: '100%'
        }}
      >
        <OTSession
          className='OTSession'
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
          apiKey={this.props.apiKey}
          sessionId={this.props.sessionId}
          token={this.props.token}
          eventHandlers={this.sessionEvents}
          onError={this.onError}
        >
          <OTPublisher 
            className='OTPublisher'
            style={{
              position: 'absolute',
              width: '360px',
              height: '240px',
              bottom: '10px',
              left: '10px',
              zIndex: '100',
              border: '3px solid white',
              borderRadius: '3px'
            }}
            properties={{
              publishAudio: true,
              publishVideo: true,
              // If videoSource is screen, it will
              // screen capture
              videoSource: undefined, 
              // These were added
              insertMode: 'append',
              width: '100%',
              height: '100%'
            }}
          />

          <OTStreams>
            <OTSubscriber 
              className='OTSubscriber'
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '100%',
                height: '100%',
                zIndex: '10'
              }}
              properties={{
                subscribeToAudio: true,
                subscribeToVideo: true,
                width: '100%',
                height: '100%'
              }}
            />
          </OTStreams>
        </OTSession>
      </div>
    );
  }
}

export default preloadScript(App);
