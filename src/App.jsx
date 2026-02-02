import { useState, useEffect, useRef, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HomeScreen } from './components/HomeScreen';
import { RoomScreen } from './components/RoomScreen';
import { ThemeProvider } from './context/ThemeContext';
import { searchYouTubeVideos } from './services/youtubeApi';
import { useRoom } from './hooks/useRoom';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { ref, set, get } from 'firebase/database';
import { db } from './services/firebase';
import { startRoomCleanupService, stopRoomCleanupService } from './services/roomCleanup';
import styles from './App.module.css';

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
    <div role="alert" className={styles.appErrorFallback}>
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
  const stateChangeTimeoutRef = useRef(null);

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

  // Enhanced player state change handler
  const handlePlayerStateChange = useCallback((state, playerInfo = {}) => {
    if (!window.YT || !window.YT.PlayerState) return;

    console.log('App received state change:', state, playerInfo);

    const { PLAYING, PAUSED, ENDED, BUFFERING } = window.YT.PlayerState;
    
    // Clear any pending state change updates
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current);
    }

    // Debounce state changes slightly to avoid rapid updates
    stateChangeTimeoutRef.current = setTimeout(() => {
      const updates = {};
      
      switch (state) {
        case PLAYING:
          if (!playbackState.isPlaying) {
            updates.isPlaying = true;
          }
          if (playerInfo.currentTime !== undefined) {
            updates.currentTime = playerInfo.currentTime;
          }
          break;
          
        case PAUSED:
        case ENDED:
          if (playbackState.isPlaying) {
            updates.isPlaying = false;
          }
          if (playerInfo.currentTime !== undefined) {
            updates.currentTime = playerInfo.currentTime;
          }
          break;
          
        case BUFFERING:
          // Don't change play state during buffering
          if (playerInfo.currentTime !== undefined) {
            updates.currentTime = playerInfo.currentTime;
          }
          break;
      }

      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        console.log('Updating playback state:', updates);
        updatePlaybackState(updates);
      }
    }, 100);
  }, [updatePlaybackState, playbackState.isPlaying]);

  const {
    playerRef,
    handleReady,
    handlePlayerStateChange: playerStateHandler,
    getCurrentTime,
    getPlayerState
  } = useYouTubePlayer(playbackState.currentVideo, handlePlayerStateChange);

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
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current);
      }
    };
  }, []);

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

  // Sync periodic time updates when playing
  useEffect(() => {
    if (!playbackState.isPlaying || !playerRef.current) return;

    const timeUpdateInterval = setInterval(() => {
      try {
        const currentTime = getCurrentTime();
        const playerState = getPlayerState();
        
        // Only update if player is actually playing
        if (playerState === window.YT.PlayerState.PLAYING) {
          updatePlaybackState({ currentTime });
        }
      } catch (error) {
        console.error('Error updating time:', error);
      }
    }, 2000); // Update every 2 seconds when playing

    return () => clearInterval(timeUpdateInterval);
  }, [playbackState.isPlaying, getCurrentTime, getPlayerState, updatePlaybackState, playerRef]);

  const resetApp = useCallback(() => {
    setAppError(null);
    leaveRoom();
  }, [leaveRoom]);

  return (
    <ThemeProvider>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error) => setAppError(error)}
        onReset={resetApp}
      >
        <div className={styles.appMainContainer}>
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
              onPlayerReady={handleReady}
              handlePlayerStateChange={playerStateHandler}
              onLeaveRoom={leaveRoom}
              removeFromQueue={removeFromQueue}
            />
          )}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;