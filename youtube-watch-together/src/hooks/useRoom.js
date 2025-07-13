import { useState, useEffect, useCallback, useRef } from 'react';
import { db, ref, get, set, onValue, push, remove, update, onDisconnect } from '../services/firebase';

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export const useRoom = (roomCode, userId, username) => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [playbackState, setPlaybackState] = useState({
    currentVideo: null,
    isPlaying: false,
    currentTime: 0,
    lastUpdated: 0
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastPlaybackUpdate = useRef(0);

  const handleError = useCallback((error) => {
    console.error('Room Error:', error);
    setError(error.message || 'An error occurred. Please try again.');
  }, []);

  useEffect(() => {
    if (!roomCode || !userId || !username) return;

    let presenceUnsub = null;
    let queueUnsub = null;
    let chatUnsub = null;
    let stateUnsub = null;
    let usersUnsub = null;

    const initializeRoom = async () => {
      try {
        const roomRef = ref(db, `rooms/${roomCode}`);
        const roomSnapshot = await get(roomRef);
        if (!roomSnapshot.exists()) {
          throw new Error('Room does not exist');
        }

        // Add user presence
        const userRef = ref(db, `rooms/${roomCode}/users/${userId}`);
        await set(userRef, {
          name: username,
          isSpeaking: false,
          joinedAt: Date.now()
        });

        // Setup presence detection
        const presenceRef = ref(db, '.info/connected');
        presenceUnsub = onValue(presenceRef, (snapshot) => {
          if (snapshot.val() === true) {
            onDisconnect(userRef).remove();
          }
        });

        // Listeners
        const setupListener = (path, updateFn) => {
          return onValue(ref(db, `rooms/${roomCode}/${path}`), (snapshot) => {
            updateFn(snapshot.val() || {});
          }, handleError);
        };

        queueUnsub = setupListener('queue', (data) => {
          setVideoQueue(Object.entries(data).map(([id, video]) => ({ id, ...video })));
        });

        chatUnsub = setupListener('chat', (data) => {
          setChatMessages(Object.entries(data)
            .map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp)
          );
        });

        stateUnsub = setupListener('state', (data) => {
          const newState = data || {
            currentVideo: null,
            isPlaying: false,
            currentTime: 0,
            lastUpdated: 0
          };

          setPlaybackState(prev => {
            if (newState.lastUpdated > prev.lastUpdated) {
              return newState;
            }
            return prev;
          });
        });

        usersUnsub = setupListener('users', (data) => {
          setUsers(data);
        });

        setLoading(false);
      } catch (error) {
        handleError(error);
        setLoading(false);
      }
    };

    initializeRoom();

    return () => {
      if (presenceUnsub) presenceUnsub();
      if (queueUnsub) queueUnsub();
      if (chatUnsub) chatUnsub();
      if (stateUnsub) stateUnsub();
      if (usersUnsub) usersUnsub();
      remove(ref(db, `rooms/${roomCode}/users/${userId}`)).catch(handleError);
    };
  }, [roomCode, userId, username, handleError]);

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
  if (now - lastPlaybackUpdate.current < 1000) return;
  
  setPlaybackState(prev => {
    // Only update if video changed or time changed significantly
    const shouldUpdate = 
      (newState.currentVideo && prev.currentVideo !== newState.currentVideo) ||
      Math.abs(prev.currentTime - (newState.currentTime || 0)) > 2;
    
    if (!shouldUpdate) return prev;
    
    lastPlaybackUpdate.current = now;
    return {
      ...prev,
      ...newState,
      lastUpdated: now
    };
  });

  try {
    await update(ref(db, `rooms/${roomCode}/state`), {
      currentVideo: newState.currentVideo || null,
      currentTime: newState.currentTime || 0,
      lastUpdated: now
    });
  } catch (error) {
    handleError(error);
  }
}, 1000), [roomCode, handleError]);

  const updateUserSpeaking = useCallback(async (isSpeaking) => {
    try {
      await update(ref(db, `rooms/${roomCode}/users/${userId}`), { isSpeaking });
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, userId, handleError]);

  return {
    videoQueue,
    chatMessages,
    playbackState,
    users,
    error,
    loading,
    addToQueue,
    removeFromQueue,
    sendMessage,
    updatePlaybackState,
    updateUserSpeaking
  };
};