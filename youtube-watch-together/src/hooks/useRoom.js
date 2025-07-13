import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  db, 
  ref, 
  get, 
  set, 
  onValue, 
  push, 
  remove, 
  update, 
  onDisconnect, 
  off 
} from '../services/firebase';
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export const useRoom = (roomCode, userId, username) => {
  const [state, setState] = useState({
    videoQueue: [],
    chatMessages: [],
    playbackState: {
      currentVideo: null,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: 0
    },
    users: {},
    error: null,
    loading: true
  });

  const lastPlaybackUpdate = useRef(0);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error) => {
    console.error('Room Error:', error);
    updateState({ 
      error: error.message || 'An error occurred. Please try again.' 
    });
  }, [updateState]);

  useEffect(() => {
    if (!roomCode || !userId || !username) return;

    const initializeRoom = async () => {
      try {
        // Verify room exists
        const roomRef = ref(db, `rooms/${roomCode}`);
        const roomSnapshot = await get(roomRef);
        if (!roomSnapshot.exists()) {
          throw new Error('Room does not exist');
        }

        // Add user to room
        await set(ref(db, `rooms/${roomCode}/users/${userId}`), {
          name: username,
          isSpeaking: false,
          joinedAt: Date.now()
        });

        // Setup presence detection
        const userRef = ref(db, `rooms/${roomCode}/users/${userId}`);
        const presenceRef = ref(db, '.info/connected');
        
        const presenceUnsub = onValue(presenceRef, (snapshot) => {
          if (snapshot.val() === true) {
            onDisconnect(userRef).remove();
          }
        });

        // Setup listeners
        const setupListener = (path, updateFn) => {
          return onValue(ref(db, `rooms/${roomCode}/${path}`), (snapshot) => {
            updateFn(snapshot.val() || {});
          }, handleError);
        };

        const queueUnsub = setupListener('queue', (data) => {
          updateState({
            videoQueue: Object.entries(data).map(([id, video]) => ({ id, ...video }))
          });
        });

        const chatUnsub = setupListener('chat', (data) => {
          updateState({
            chatMessages: Object.entries(data)
              .map(([id, msg]) => ({ id, ...msg }))
              .sort((a, b) => a.timestamp - b.timestamp)
          });
        });

        const stateUnsub = setupListener('state', (data) => {
          const newState = data || {
            currentVideo: null,
            isPlaying: false,
            currentTime: 0,
            lastUpdated: 0
          };
          
          if (newState.lastUpdated > state.playbackState.lastUpdated) {
            updateState({
              playbackState: newState
            });
          }
        });

        const usersUnsub = setupListener('users', (data) => {
          updateState({
            users: data
          });
        });

        updateState({ loading: false });

        return () => {
          presenceUnsub();
          queueUnsub();
          chatUnsub();
          stateUnsub();
          usersUnsub();
          remove(userRef).catch(handleError);
        };
      } catch (error) {
        handleError(error);
        updateState({ loading: false });
      }
    };

    initializeRoom();

    return () => {
      // Cleanup will be handled by the unsubscribe functions
    };
  }, [roomCode, userId, username, updateState, handleError, state.playbackState.lastUpdated]);

  const addToQueue = useCallback(async (video) => {
    try {
      const videoRef = ref(db, `rooms/${roomCode}/queue/${video.id}`);
      await set(videoRef, {
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnail,
        addedBy: username,
        addedAt: Date.now()
      });
      updateState((prev) => ({
        videoQueue: [...prev.videoQueue, { id: video.id, ...video }]
      }));
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, username, handleError]);

  const removeFromQueue = useCallback(async (videoId) => {
    try {
      await remove(ref(db, `rooms/${roomCode}/queue/${videoId}`));
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, handleError]);

  const sendMessage = useCallback(async (text) => {
    try {
      await push(ref(db, `rooms/${roomCode}/chat`), {
        text,
        user: username,
        timestamp: Date.now()
      });
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, username, handleError]);

const updatePlaybackState = useCallback(debounce(async (newState) => {
  const now = Date.now();
  if (now - lastPlaybackUpdate.current < 500) return;
  lastPlaybackUpdate.current = now;
  
  try {
    await update(ref(db, `rooms/${roomCode}/state`), {
      ...newState,
      lastUpdated: now
    });
  } catch (error) {
    handleError(error);
  }
}, 500), [roomCode, handleError]);

  const updateUserSpeaking = useCallback(async (isSpeaking) => {
    try {
      await update(ref(db, `rooms/${roomCode}/users/${userId}`), { isSpeaking });
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, userId, handleError]);

  return {
    ...state,
    addToQueue,
    removeFromQueue,
    sendMessage,
    updatePlaybackState,
    updateUserSpeaking
  };
};