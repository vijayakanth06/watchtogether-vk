import { useState, useEffect, useRef, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HomeScreen } from './components/HomeScreen';
import { RoomScreen } from './components/RoomScreen';
import { searchYouTubeVideos } from './services/youtubeApi';
import { useRoom } from './hooks/useRoom';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { ref, set, get } from 'firebase/database';
import { db } from './services/firebase'; 
import { startRoomCleanupService, stopRoomCleanupService } from './services/roomCleanup';

// Session management utilities
const SESSION_KEY = 'yt_watch_together_session';
const SESSION_EXPIRY_HOURS = 1;

const saveSession = (roomCode, username, userId) => {
  const session = {
    roomCode,
    username,
    userId,
    expiresAt: Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const loadSession = () => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  
  const session = JSON.parse(sessionStr);
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');
  const [appError, setAppError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2)).current;
  const cleanupIntervalRef = useRef(null);

  const {
    videoQueue,
    chatMessages,
    playbackState,
    users,
    error: roomError,
    loading: roomLoading,
    addToQueue,
    removeFromQueue,
    sendMessage,
    updatePlaybackState,
    updateUserSpeaking
  } = useRoom(roomCode, userId, username);

  const { startSpeaking, stopSpeaking } = useVoiceChat(roomCode, userId, users);

  // Load session and initialize cleanup service
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setRoomCode(session.roomCode);
      setUsername(session.username);
      setHasJoined(true);
      setScreen('room');
    }

    cleanupIntervalRef.current = startRoomCleanupService();
    
    return () => {
      if (cleanupIntervalRef.current) {
        stopRoomCleanupService(cleanupIntervalRef.current);
      }
    };
  }, []);

  const handlePlayerStateChange = useCallback((state) => {
    if (!window.YT || !window.YT.PlayerState) return;

    switch (state) {
      case window.YT.PlayerState.PLAYING:
        updatePlaybackState({ isPlaying: true });
        break;
      case window.YT.PlayerState.PAUSED:
      case window.YT.PlayerState.ENDED:
        updatePlaybackState({ isPlaying: false });
        break;
      default:
        break;
    }
  }, [updatePlaybackState]);

  const {
    playerRef,
    handleReady,
    loadVideo,
    playVideo,
    pauseVideo,
    seekTo,
    getCurrentTime,
    playerReady
  } = useYouTubePlayer(playbackState.currentVideo, handlePlayerStateChange);

  const generateRoomCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, []);

  const createRoom = useCallback(async () => {
    const newRoomCode = generateRoomCode();
    await set(ref(db, `rooms/${newRoomCode}`), {
      createdAt: Date.now(),
      createdBy: username,
    });
    setRoomCode(newRoomCode);
    setHasJoined(true);
    setScreen('room');
    saveSession(newRoomCode, username, userId);
  }, [generateRoomCode, username, userId]);

  const joinRoom = useCallback(async () => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) throw new Error('Room not found');

    setHasJoined(true);
    setScreen('room');
    saveSession(roomCode, username, userId);
  }, [roomCode, username, userId]);

  const leaveRoom = useCallback(() => {
    setScreen('home');
    setRoomCode('');
    setSearchQuery('');
    setSearchResults([]);
    setMessage('');
    clearSession();
  }, []);

  const handleSearch = useCallback(async () => {
    try {
      const results = await searchYouTubeVideos(searchQuery, import.meta.env.VITE_YOUTUBE_API_KEY);
      setSearchResults(results);
    } catch (error) {
      setAppError(error);
    }
  }, [searchQuery]);

  const handlePushToTalk = useCallback(async (isActive) => {
    try {
      if (isActive) {
        await startSpeaking();
        updateUserSpeaking(true);
      } else {
        stopSpeaking();
        updateUserSpeaking(false);
      }
    } catch (error) {
      console.error('Error with push-to-talk:', error);
    }
  }, [startSpeaking, stopSpeaking, updateUserSpeaking]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !window.YT) return;

    const player = playerRef.current;
    const currentVideoId = player.getVideoData()?.video_id;
    
    // Only sync if there's a meaningful difference
    if (playbackState.currentVideo && currentVideoId !== playbackState.currentVideo) {
      loadVideo(playbackState.currentVideo);
      return;
    }

    const currentTimeInPlayer = player.getCurrentTime();
    if (Math.abs(currentTimeInPlayer - playbackState.currentTime) > 2) {
      seekTo(playbackState.currentTime);
    }
  }, [playbackState.currentVideo, playbackState.currentTime, playerReady, loadVideo, seekTo]);

  const resetApp = useCallback(() => {
    setAppError(null);
    leaveRoom();
  }, [leaveRoom]);

  if (appError) {
    return <ErrorFallback error={appError} resetErrorBoundary={resetApp} />;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => setAppError(error)}
      onReset={resetApp}
    >
      {screen === 'home' ? (
        <HomeScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          username={username}
          setUsername={setUsername}
          error={roomError}
        />
      ) : (
        <RoomScreen
          roomCode={roomCode}
          username={username}
          videoQueue={videoQueue}
          chatMessages={chatMessages}
          playbackState={playbackState}
          updatePlaybackState={updatePlaybackState}
          users={users}
          searchResults={searchResults}
          message={message}
          error={roomError}
          isSpeaking={users[userId]?.isSpeaking || false}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          onAddToQueue={addToQueue}
          onMessageChange={setMessage}
          onSendMessage={() => {
            sendMessage(message);
            setMessage('');
          }}
          onPushToTalk={handlePushToTalk}
          onPlayerReady={handleReady}
          onPlayerStateChange={handlePlayerStateChange}
          onLeaveRoom={leaveRoom}
          removeFromQueue={removeFromQueue}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;