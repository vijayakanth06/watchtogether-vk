import { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';

export const YouTubePlayer = ({
  videoId,
  isPlaying,
  currentTime,
  onReady,
  onStateChange,
  onError
}) => {
  const playerRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const lastSyncRef = useRef({
    videoId: null,
    isPlaying: false,
    currentTime: 0,
    timestamp: 0
  });

  // Memoized event handlers
  const handleReady = useCallback((event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    if (onReady) onReady(event);
  }, [onReady]);

  const handleError = useCallback((error) => {
    console.error('YouTube Player Error:', error);
    setHasError(true);
    if (onError) onError(error);
  }, [onError]);

 useEffect(() => {
  if (!playerReady || !playerRef.current) return;

  const player = playerRef.current;
  const lastSync = lastSyncRef.current;

  // If nothing changed, don't sync
  const videoChanged = videoId !== lastSync.videoId;
  const timeChanged = Math.abs(currentTime - lastSync.currentTime) > 2;
  const playbackChanged = isPlaying !== lastSync.isPlaying;

  const sync = async () => {
    try {
      if (videoChanged) {
        await player.cueVideoById({ videoId, startSeconds: currentTime });
        lastSync.videoId = videoId;
        lastSync.currentTime = currentTime;
        lastSync.isPlaying = isPlaying;
        if (isPlaying) await player.playVideo();
        return;
      }

      if (timeChanged) {
        await player.seekTo(currentTime, true);
        lastSync.currentTime = currentTime;
      }

      if (playbackChanged) {
        if (isPlaying) await player.playVideo();
        else await player.pauseVideo();
        lastSync.isPlaying = isPlaying;
      }
    } catch (err) {
      console.error('YouTube sync error:', err);
    }
  };

  sync();
}, [videoId, isPlaying, currentTime, playerReady]);


  if (!videoId || hasError) {
    return (
      <div style={{
        width: '640px',
        height: '360px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {hasError ? 'Error loading video' : 'No video selected'}
      </div>
    );
  }

  return (
    <YouTube
      videoId={videoId}
      opts={{
        height: '360',
        width: '640',
        playerVars: {
          autoplay: 0, // Let our sync logic handle autoplay
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1
        }
      }}
      onReady={handleReady}
      onStateChange={onStateChange}
      onError={handleError}
    />
  );
};