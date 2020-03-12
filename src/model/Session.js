/**
 * Returns a -1 if the event.stream.id is not found in the streams
 * array, else returns the index the id is found.
 */
function getStreamIndex(streams, eventStreamId) {
  const wantedId = eventStreamId; 
  const index = streams.findIndex(
    stream => stream.id === wantedId
  );
  return index;
}

/**
 * If the stream id is not found, the event is added to the streams
 * array.
 * @param {array} streams 
 * @param {*} event
 * @param {func} onStreamsUpdated
 */
function onStreamCreated(streams, event, onStreamsUpdated) {
  const index = getStreamIndex(streams, event.stream.id);
  if (index < 0) {
    streams.push(event.stream);
    onStreamsUpdated(streams);
  }
  return streams;
}

/**
 * If the stream id is found, the event is deleted from the streams 
 * array.
 * @param {array} streams 
 * @param {*} event
 * @param {func} onStreamsUpdated
 */
function onStreamDestroyed(streams, event, onStreamsUpdated) {
  const index = getStreamIndex(streams, event.stream.id);
  if (index >= 0) {
    streams.splice(index, 1);
    onStreamsUpdated(streams);
  }
}

function createSession({
  apiKey,
  sessionId,
  token,
  onStreamsUpdated,
  onConnect,
  onError
} = {}) {
  if (!apiKey) { throw new Error('Missing apiKey'); }
  if (!sessionId) { throw new Error('Missing sessionId'); }
  if (!token) { throw new Error('Missing token'); }

  // Publisher and subscriber streams
  let streams = [];

  let eventHandlers = {
    streamCreated: onStreamCreated,
    streamDestroyed: onStreamDestroyed
  };

  // Initializes and returns the local session object for a specified
  // session ID.
  let session = OT.initSession(apiKey, sessionId);
  session.on(eventHandlers);
  session.connect(token, err => {
    // If there is no session, either this session has been
    // disconnected or OTSession has been unmounted so don't invoke
    // any callbacks.
    if (!session) { return; }

    if (err && typeof onError === 'function') {
      onError(err);
    } else if (!err && typeof onConnect === 'function') {
      onConnect();
    }
  });

  let disconnect = () => {
    if (session) {
      session.off(eventHandlers);
      session.disconnect();
    }

    streams = null;
    onStreamCreated = null;
    onStreamDestroyed = null;
    eventHandlers = null;
    session = null;

    // ? Not sure if this this.session and session refer to the same
    // ? variable.
    this.session = null;
    this.streams = null;
  };

  return { session, streams, disconnect };
}

export default createSession;
