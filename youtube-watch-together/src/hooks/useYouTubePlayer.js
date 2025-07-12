import { useState, useRef } from 'react';

export const useYouTubePlayer = () => {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  const handleReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
  };

  const loadVideo = (videoId) => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.loadVideoById(videoId);
      } catch (err) {
        console.warn('loadVideo error:', err);
      }
    }
  };

  const playVideo = () => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.playVideo();
      } catch (err) {
        console.warn('playVideo error:', err);
      }
    }
  };

  const pauseVideo = () => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.warn('pauseVideo error:', err);
      }
    }
  };

  const seekTo = (seconds) => {
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
      } catch (err) {
        console.warn('seekTo error:', err);
      }
    }
  };

  const getCurrentTime = () => {
    if (playerReady && playerRef.current) {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  };

  return {
    playerRef,
    handleReady,
    loadVideo,
    playVideo,
    pauseVideo,
    seekTo,
    getCurrentTime,
    playerReady
  };
};
