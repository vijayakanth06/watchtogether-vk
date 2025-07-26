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
import './App.css';

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
    <div role="alert" className="error-fallback">
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

        const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;

        if (state === PLAYING && !playbackState.isPlaying) {
            updatePlaybackState({ isPlaying: true });
        } else if ((state === PAUSED || state === ENDED) && playbackState.isPlaying) {
            updatePlaybackState({ isPlaying: false });
        }
    }, [updatePlaybackState, playbackState.isPlaying]);


  const {
    playerRef,
    handleReady,
  } = useYouTubePlayer(playbackState.currentVideo, handlePlayerStateChange);

  const generateRoomCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, []);

  const createRoom = useCallback(async () => {
    if (!username.trim()) {
        setAppError(new Error("Username cannot be empty."));
        return;
    }
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
    if (!username.trim() || !roomCode.trim()) {
        setAppError(new Error("Username and Room Code are required."));
        return;
    }
    const roomRef = ref(db, `rooms/${roomCode}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) {
        setAppError(new Error('Room not found'));
        return;
    };

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
    setHasJoined(false);
    clearSession();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;
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
    if (!playerRef.current || !playbackState.currentVideo) return;
    
    const player = playerRef.current;
    const playerState = player.getPlayerState();

    // Sync playing state
    if (playbackState.isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
    } else if (!playbackState.isPlaying && playerState === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
    }

    // Sync time (with a tolerance)
    const timeDiff = Math.abs(player.getCurrentTime() - playbackState.currentTime);
    if (timeDiff > 2) {
        player.seekTo(playbackState.currentTime, true);
    }

  }, [playbackState, playerRef]);


  const resetApp = useCallback(() => {
    setAppError(null);
    leaveRoom();
  }, [leaveRoom]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => setAppError(error)}
      onReset={resetApp}
    >
      <div className="App">
        {screen === 'home' ? (
          <HomeScreen
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            username={username}
            setUsername={setUsername}
            error={appError?.message || roomError}
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
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearch}
            onAddToQueue={addToQueue}
            onMessageChange={setMessage}
            onSendMessage={() => {
              if (message.trim()) {
                sendMessage(message);
                setMessage('');
              }
            }}
            onPushToTalk={handlePushToTalk}
            onPlayerReady={handleReady}
            handlePlayerStateChange={handlePlayerStateChange}
            onLeaveRoom={leaveRoom}
            removeFromQueue={removeFromQueue}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;