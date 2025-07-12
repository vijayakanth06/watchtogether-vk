import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { database, ref, set, push, onValue, off, remove, get } from './firebase';
import YouTubePlayer from './components/YouTubePlayer';
import VideoControls from './components/VideoControls';
import VideoQueue from './components/VideoQueue';
import ChatWindow from './components/ChatWindow';
import { searchVideos } from './utils/youtube';
import { validateRoomCode, validateUsername, validateMessage, validateVideoData } from './utils/validation';

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const App = () => {
  // State
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [videoQueue, setVideoQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // Refs
  const userId = useRef(uuidv4());
  const pcRefs = useRef({});
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Memoized values
  const memoizedChatMessages = useMemo(() => {
    return chatMessages.map(msg => ({
      ...msg,
      formattedTime: new Date(msg.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  }, [chatMessages]);

  const memoizedVideoQueue = useMemo(() => {
    return videoQueue.map(video => ({
      ...video,
      canRemove: video.addedBy === username || isHost
    }));
  }, [videoQueue, username, isHost]);

  // Room management
  const createRoom = useCallback(() => {
    const newRoomCode = generateRoomCode();
    setRoomCode(newRoomCode);
    setIsHost(true);
    set(ref(database, `rooms/${newRoomCode}`), {
      created: Date.now(),
      host: userId.current
    });
    joinRoom(newRoomCode);
  }, []);

  const checkRoomExists = useCallback(async (code) => {
    const roomRef = ref(database, `rooms/${code}`);
    const snapshot = await get(roomRef);
    return snapshot.exists();
  }, []);

  const joinRoom = useCallback(async (code) => {
    if (!validateRoomCode(code)) {
      alert('Invalid room code');
      return;
    }

    if (!validateUsername(username)) {
      alert('Please enter a valid username (1-20 characters)');
      return;
    }

    const exists = await checkRoomExists(code);
    if (!exists) {
      alert('Room does not exist');
      return;
    }

    setRoomCode(code);
    setupRoomListeners(code);
    setScreen('room');
    setupVoiceChat(code);
  }, [username, checkRoomExists]);

  const setupRoomListeners = useCallback((code) => {
    // Chat messages
    const chatRef = ref(database, `rooms/${code}/chat`);
    onValue(chatRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      setChatMessages(messages);
    });

    // Video queue
    const queueRef = ref(database, `rooms/${code}/queue`);
    onValue(queueRef, (snapshot) => {
      const queue = [];
      snapshot.forEach((childSnapshot) => {
        queue.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      setVideoQueue(queue);
    });

    // Playback state
    const stateRef = ref(database, `rooms/${code}/state`);
    onValue(stateRef, (snapshot) => {
      const state = snapshot.val();
      if (state) {
        setCurrentVideo(state.currentVideoId);
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.currentTime);
      }
    });

    // Host status
    const roomRef = ref(database, `rooms/${code}`);
    onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      setIsHost(roomData?.host === userId.current);
    });
  }, []);

  // Video playback
  const updatePlaybackState = useCallback((videoId, playing, time) => {
    const stateRef = ref(database, `rooms/${roomCode}/state`);
    set(stateRef, {
      currentVideoId: videoId,
      isPlaying: playing,
      currentTime: time
    });
  }, [roomCode]);

  const playNextVideo = useCallback(() => {
    if (videoQueue.length > 0) {
      const nextVideo = videoQueue[0];
      setCurrentVideo(nextVideo.videoId);
      updatePlaybackState(nextVideo.videoId, true, 0);
      
      const queueRef = ref(database, `rooms/${roomCode}/queue/${nextVideo.id}`);
      remove(queueRef);
    } else {
      setCurrentVideo(null);
      const stateRef = ref(database, `rooms/${roomCode}/state`);
      set(stateRef, null);
    }
  }, [videoQueue, roomCode, updatePlaybackState]);

  // Chat
  const sendMessage = useCallback(() => {
    if (!validateMessage(message)) {
      alert('Message must be 1-200 characters');
      return;
    }

    const chatRef = ref(database, `rooms/${roomCode}/chat`);
    push(chatRef, {
      username: username || 'Anonymous',
      text: message.trim(),
      timestamp: Date.now()
    });
    setMessage('');
  }, [message, roomCode, username]);

  // Video search
  const handleSearch = useCallback(async () => {
    try {
      const results = await searchVideos(searchQuery, youtubeApiKey);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      alert(error.message);
    }
  }, [searchQuery, youtubeApiKey]);

  const addToQueue = useCallback((video) => {
    if (!validateVideoData(video)) {
      alert('Invalid video data');
      return;
    }

    const queueRef = ref(database, `rooms/${roomCode}/queue`);
    push(queueRef, {
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.default.url,
      addedBy: username || 'Anonymous'
    });
  }, [roomCode, username]);

  // Voice chat
  const setupVoiceChat = useCallback(async (roomId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      
      const participantsRef = ref(database, `rooms/${roomId}/voice/participants`);
      set(push(participantsRef), {
        userId: userId.current,
        isSpeaking: false
      });

      // Existing peer connection setup...
    } catch (error) {
      console.error('Voice chat error:', error);
    }
  }, []);

  const cleanupVoiceChat = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStreams([]);
  }, [localStream]);

  // Cleanup
  const leaveRoom = useCallback(() => {
    cleanupVoiceChat();
    setScreen('home');
    setRoomCode('');
    setCurrentVideo(null);
    setVideoQueue([]);
    setChatMessages([]);
  }, [cleanupVoiceChat]);

  useEffect(() => {
    return () => {
      if (roomCode) {
        cleanupVoiceChat();
      }
    };
  }, [roomCode, cleanupVoiceChat]);

  return (
    <div>
      {screen === 'home' ? (
        <div>
          <h1>YouTube Watch Together</h1>
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <button onClick={createRoom}>Create Room</button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button onClick={() => joinRoom(roomCode)}>Join Room</button>
          </div>
        </div>
      ) : (
        <div>
          <div>
            <h2>Room: {roomCode}</h2>
            <button onClick={leaveRoom}>Leave Room</button>
          </div>
          
          <div>
            <h3>Now Playing</h3>
            {currentVideo ? (
              <div>
                <YouTubePlayer
                  videoId={currentVideo}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  onReady={() => {}}
                  onStateChange={(e) => {
                    if (e.data === YouTube.PlayerState.PLAYING) {
                      setIsPlaying(true);
                    } else if (e.data === YouTube.PlayerState.PAUSED) {
                      setIsPlaying(false);
                    } else if (e.data === YouTube.PlayerState.ENDED) {
                      playNextVideo();
                    }
                  }}
                  onTimeUpdate={(time) => setCurrentTime(time)}
                />
                <VideoControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onPlayPause={() => updatePlaybackState(
                    currentVideo, 
                    !isPlaying, 
                    currentTime
                  )}
                  onSeek={(time) => updatePlaybackState(
                    currentVideo, 
                    isPlaying, 
                    time
                  )}
                  onNext={playNextVideo}
                />
              </div>
            ) : (
              <p>No video playing</p>
            )}
          </div>
          
          <VideoQueue 
            queue={memoizedVideoQueue} 
            onRemove={(id) => remove(ref(database, `rooms/${roomCode}/queue/${id}`))}
            currentUser={username}
          />
          
          <div>
            <h3>Add Videos</h3>
            <div>
              <input
                type="text"
                placeholder="Search YouTube"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button onClick={handleSearch}>Search</button>
            </div>
            <ul>
              {searchResults.map((video) => (
                <li key={video.id.videoId}>
                  <img 
                    src={video.snippet.thumbnail} 
                    alt={video.snippet.title} 
                    width="120" 
                    height="90" 
                  />
                  <span>{video.snippet.title}</span>
                  <button onClick={() => addToQueue(video)}>Add to Queue</button>
                </li>
              ))}
            </ul>
          </div>
          
          <ChatWindow
            messages={memoizedChatMessages}
            onSend={sendMessage}
            username={username}
          />
          
          <div>
            <h3>Voice Chat</h3>
            <div>
              <p>Current speaker: {currentSpeaker === userId.current ? 'You' : currentSpeaker || 'None'}</p>
              <button
                onMouseDown={() => handlePushToTalk(true)}
                onMouseUp={() => handlePushToTalk(false)}
                onTouchStart={() => handlePushToTalk(true)}
                onTouchEnd={() => handlePushToTalk(false)}
              >
                Push to Talk
              </button>
            </div>
            <div>
              <video ref={localVideoRef} autoPlay muted />
              <video ref={remoteVideoRef} autoPlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;