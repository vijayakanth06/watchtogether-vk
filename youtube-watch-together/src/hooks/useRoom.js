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
  const queueRef = useRef([]);

  const handleError = useCallback((error) => {
    console.error('Room Error:', error);
    setError(error.message || 'An error occurred. Please try again.');
  }, []);

  const playNextVideo = useCallback(async () => {
    try {
      if (queueRef.current.length === 0) return;

      const currentIndex = queueRef.current.findIndex(v => v.id === playbackState.currentVideo);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < queueRef.current.length) {
        const nextVideo = queueRef.current[nextIndex];
        await update(ref(db, `rooms/${roomCode}/state`), {
          currentVideo: nextVideo.id,
          isPlaying: true,
          currentTime: 0,
          lastUpdated: Date.now()
        });
      } else {
        // Queue ended
        await update(ref(db, `rooms/${roomCode}/state`), {
          currentVideo: null,
          isPlaying: false,
          currentTime: 0,
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, playbackState.currentVideo, handleError]);

  useEffect(() => {
    queueRef.current = videoQueue;
  }, [videoQueue]);

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

        // Setup listeners
        const setupListener = (path, updateFn) => {
          return onValue(ref(db, `rooms/${roomCode}/${path}`), (snapshot) => {
            const data = snapshot.val();
            updateFn(data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : []);
          }, handleError);
        };

        queueUnsub = onValue(ref(db, `rooms/${roomCode}/queue`), (snapshot) => {
          const data = snapshot.val();
          const queue = data ? Object.entries(data).map(([id, video]) => ({ id, ...video })) : [];
          setVideoQueue(queue);
        });

        chatUnsub = setupListener('chat', (messages) => {
          setChatMessages(messages.sort((a, b) => a.timestamp - b.timestamp));
        });

        stateUnsub = onValue(ref(db, `rooms/${roomCode}/state`), (snapshot) => {
          const data = snapshot.val() || {
            currentVideo: null,
            isPlaying: false,
            currentTime: 0,
            lastUpdated: 0
          };
          setPlaybackState(prev => {
            if (data.lastUpdated > prev.lastUpdated) {
              return data;
            }
            return prev;
          });
        });

        usersUnsub = setupListener('users', setUsers);

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

  const updatePlaybackState = useCallback(debounce(async (newState) => {
    const now = Date.now();
    if (now - lastPlaybackUpdate.current < 1000) return;
    
    setPlaybackState(prev => {
      const shouldUpdate = 
        (newState.currentVideo && prev.currentVideo !== newState.currentVideo) ||
        Math.abs(prev.currentTime - (newState.currentTime || 0)) > 2 ||
        prev.isPlaying !== newState.isPlaying;
      
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
        ...newState,
        lastUpdated: now
      });
    } catch (error) {
      handleError(error);
    }
  }, 1000), [roomCode, handleError]);
  
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

      // If queue was empty, start playing this video
      if (videoQueue.length === 0 && !playbackState.currentVideo) {
        await updatePlaybackState({
          currentVideo: video.id,
          isPlaying: true,
          currentTime: 0
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, username, videoQueue, playbackState.currentVideo, updatePlaybackState, handleError]);

  const removeFromQueue = useCallback(async (videoId) => {
    try {
      await remove(ref(db, `rooms/${roomCode}/queue/${videoId}`));

      // If we removed the currently playing video, play the next one
      if (playbackState.currentVideo === videoId) {
        await playNextVideo();
      }
    } catch (error) {
      handleError(error);
    }
  }, [roomCode, playbackState.currentVideo, playNextVideo, handleError]);

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

  const handlePlayerStateChange = useCallback((state) => {
    const now = Date.now();
    
    // Only update state if significant time has passed since last update
    if (now - lastPlaybackUpdate.current < 500) return;

    // Handle video ended state
    if (state === 0) { // Ended
      playNextVideo();
      return;
    }

    // Update local state immediately for responsiveness
    setPlaybackState(prev => {
      // Don't update if nothing changed
      if (state === 1 && prev.isPlaying) return prev;
      if (state === 2 && !prev.isPlaying) return prev;
      
      return {
        ...prev,
        isPlaying: state === 1, // playing
        lastUpdated: now
      };
    });

    // Debounce the Firebase update
    const updateState = async () => {
      try {
        await update(ref(db, `rooms/${roomCode}/state`), {
          isPlaying: state === 1,
          lastUpdated: now
        });
        lastPlaybackUpdate.current = now;
      } catch (error) {
        handleError(error);
      }
    };

    // Only update play/pause state if it's a significant change
    if (state === 1 || state === 2) {
      updateState();
    }
  }, [roomCode, playNextVideo, handleError]);

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
    handlePlayerStateChange,
    updateUserSpeaking
  };
};