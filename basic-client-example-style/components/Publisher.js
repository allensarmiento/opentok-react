import React, { Component } from 'react';

import { OTPublisher } from '../../src'
import RadioButtons from './RadioButtons';
import CheckBox from './CheckBox';

export default class Publisher extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      audio: true,
      video: true,
      videoSource: 'camera'
    };
  }

  setAudio = (audio) => {
    this.setState({ audio });
  }

  setVideo = (video) => {
    this.setState({ video });
  }

  setVideoSource = (videoSource) => {
    this.setState({ videoSource });
  }

  onError = (err) => {
    this.setState({ error: `Failed to publish: ${err.message}` });
  }

  render() {
    return (
      <div className='PublisherContainer'>
        {this.state.error ? <div>{this.state.error}</div> : null}
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
            publishAudio: this.state.audio,
            publishVideo: this.state.video,
            videoSource: this.state.videoSource === 'screen' ? 'screen' : undefined,
            // These were added
            insertMode: 'append',
            width: '100%',
            height: '100%'
          }}
          onError={this.onError}
        />
        <RadioButtons
          buttons={[
            {
              label: 'Camera',
              value: 'camera'
            },
            {
              label: 'Screen',
              value: 'screen'
            }
          ]}
          initialChecked={this.state.videoSource}
          onChange={this.setVideoSource}
        />
        <CheckBox
          label="Publish Audio"
          initialChecked={this.state.audio}
          onChange={this.setAudio}
        />
        <CheckBox
          label="Publish Video"
          initialChecked={this.state.video}
          onChange={this.setVideo}
        />
      </div>
    );
  }
}

