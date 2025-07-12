import { useEffect, useRef, useState } from 'react';
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
  const lastSyncTimeRef = useRef(0);

  const handleReady = (event) => {
    playerRef.current = event.target; // real YT player instance
    if (onReady) onReady(event);
  };

  

  const handleError = (error) => {
    console.error('YouTube Player Error:', error);
    setHasError(true);
    if (onError) onError(error);
  };

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !videoId || hasError) return;

    const syncState = async () => {
      try {
        const state = await player.getPlayerState();
        const time = await player.getCurrentTime();

        if (isPlaying && state !== 1) {
          player.playVideo();
        } else if (!isPlaying && state === 1) {
          player.pauseVideo();
        }

        if (Math.abs(time - currentTime) > 1) {
          player.seekTo(currentTime, true);
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    };

    const interval = setInterval(syncState, 500);
    return () => clearInterval(interval);
  }, [videoId, isPlaying, currentTime, hasError]);

  if (!videoId || hasError) {
    return (
      <div
        style={{
          width: '640px',
          height: '360px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
        },
      }}
      onReady={handleReady}
      onStateChange={onStateChange}
      onError={handleError}
    />
  );
};
