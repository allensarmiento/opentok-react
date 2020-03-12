class Session {
  constructor({apiKey, sessionId, token, onStreamsUpdated, onConnect, onError} = {}) {
    if (!apiKey) { throw new Error('Missing apiKey'); }
    if (!sessionId) { throw new Error('Missing sessionId') };
    if (!token) { throw new Error('Missing token'); }

    this.apiKey = apiKey;
    this.sessionId = sessionId;
    this.token = token;
    this.onStreamsUpdated = onStreamsUpdated;
    this.onConnect = onConnect;
    this.onError = onError;

    this.session = null;
    this.eventHandlers = {};
    this.streams = [];
  }

  setSession(session) {
    this.session = session;
  }

  getSession() {
    return this.session;
  }

  getStreams() {
    return this.streams;
  }

  getStreamIndex(eventStreamId) {
    // event.stream.id is the element we are looking for.
    // If event.stream.id is not found in the streams array, a value
    // of -1 is returned.
    const index = this.streams.findIndex(
      stream => stream.id === event.stream.id
    );

    return index;
  }

  onStreamCreated(event) {
    const index = this.getStreamIndex(event.stream.id);

    if (index < 0) {
      // event.stream.id was not found, so this must be a new stream.
      this.streams.push(event.stream);
      onStreamsUpdated(this.streams);
    }
  }

  onStreamDestroyed(event) {
    const index = this.getStreamIndex(event.stream.id);

    if (index >= 0) {
      this.streams.splice(index, 1);
      onStreamsUpdated(streams);
    }
  }

  disconnect(eventHandlers) {
    if (this.session) {
      this.session.off(eventHandlers);
      this.session.disconnect();

      this.streams = null;
      this.onStreamCreated = null;
      this.onStreamDestroyed = null;
      this.eventHandlers = null;
      this.session = null;
    }
  }

  createSession() {
    // apiKey, sessionId, and token are verified in the constructor,
    // so should not have to check again.

    this.eventHandlers = {
      streamCreated: onStreamCreated,
      streamDestroyed: onStreamDestroyed
    };

    // Initialize the opentok session.
    this.session = OT.initSession(this.apiKey, this.sessionId);
    this.session.on(eventHandlers);
    this.session.connect(token, err => {
      if (!session) {
        // Either the session has been disconnected or OTSession
        // has been unmounted so don't invoke any callbacks.
        return;
      }

      if (err && typeof this.onError === 'function') {
        this.onError(err);
      } else if (!err && typeof this.onConnect === 'function') {
        this.onConnect();
      }
    });
  }
}

export default Session;
