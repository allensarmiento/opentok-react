import React, { Component } from 'react';
import { OTSession, OTStreams, OTPublisher, OTSubscriber, preloadScript } from '../../src'
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
      <div className='App'>
        <OTSession
          className='OTSession'
          apiKey={this.props.apiKey}
          sessionId={this.props.sessionId}
          token={this.props.token}
          eventHandlers={this.sessionEvents}
          onError={this.onError}
        >
          <OTPublisher 
            className='OTPublisher'
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

          <OTStreams className="OTStreams">
            <OTSubscriber 
              className='OTSubscriber'
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
