import { useState, useRef, useCallback } from 'react';

export const useYouTubePlayer = (currentVideo, onStateChange) => {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const lastReportedTime = useRef(0);

  const handleReady = useCallback((event) => {
    console.log('Player ready callback');
    playerRef.current = event.target;
    setPlayerReady(true);
  }, []);

  const handlePlayerStateChange = useCallback((state) => {
    console.log('Player state change from hook:', state);
    
    if (!playerRef.current) return;

    // Report state changes and current time
    try {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      
      // Update time more frequently when playing
      if (state === window.YT.PlayerState.PLAYING) {
        lastReportedTime.current = currentTime;
      }
      
      // Call the parent's state change handler
      onStateChange(state, {
        currentTime: currentTime || 0,
        duration: duration || 0
      });
      
    } catch (error) {
      console.error('Error getting player info:', error);
      onStateChange(state);
    }
  }, [onStateChange]);

  const loadVideo = useCallback((videoId, startTime = 0) => {
    if (playerReady && playerRef.current && videoId) {
      try {
        console.log('Loading video via hook:', videoId);
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: startTime
        });
      } catch (err) {
        console.error('loadVideo error:', err);
      }
    }
  }, [playerReady]);

  const playVideo = useCallback(() => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.playVideo();
      } catch (err) {
        console.error('playVideo error:', err);
      }
    }
  }, [playerReady]);

  const pauseVideo = useCallback(() => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.error('pauseVideo error:', err);
      }
    }
  }, [playerReady]);

  const seekTo = useCallback((seconds) => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
        lastReportedTime.current = seconds;
      } catch (err) {
        console.error('seekTo error:', err);
      }
    }
  }, [playerReady]);

  const getCurrentTime = useCallback(() => {
    if (playerReady && playerRef.current) {
      try {
        return playerRef.current.getCurrentTime() || 0;
      } catch (err) {
        console.error('getCurrentTime error:', err);
        return 0;
      }
    }
    return 0;
  }, [playerReady]);

  const getPlayerState = useCallback(() => {
    if (playerReady && playerRef.current) {
      try {
        return playerRef.current.getPlayerState();
      } catch (err) {
        console.error('getPlayerState error:', err);
        return -1;
      }
    }
    return -1;
  }, [playerReady]);

  const getDuration = useCallback(() => {
    if (playerReady && playerRef.current) {
      try {
        return playerRef.current.getDuration() || 0;
      } catch (err) {
        console.error('getDuration error:', err);
        return 0;
      }
    }
    return 0;
  }, [playerReady]);

  return {
    playerRef,
    handleReady,
    handlePlayerStateChange,
    loadVideo,
    playVideo,
    pauseVideo,
    seekTo,
    getCurrentTime,
    getPlayerState,
    getDuration,
    playerReady
  };
};