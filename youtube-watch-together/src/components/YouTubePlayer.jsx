import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayerComponent = ({
  videoId,
  isPlaying,
  currentTime,
  onReady,
  onStateChange,
  onError
}) => {
  const playerRef = useRef(null);
  const [internalReady, setInternalReady] = useState(false);
  const prevVideoId = useRef(null);
  const prevIsPlaying = useRef(isPlaying);
  const prevCurrentTime = useRef(currentTime);

  const handleReady = useCallback((event) => {
    playerRef.current = event.target;
    setInternalReady(true);
    prevVideoId.current = videoId;
    prevIsPlaying.current = isPlaying;
    prevCurrentTime.current = currentTime;
    onReady?.(event);
  }, [videoId, isPlaying, currentTime, onReady]);

  useEffect(() => {
    if (!internalReady || !playerRef.current) return;

    const player = playerRef.current;
    
    try {
      // Only handle video changes
      if (videoId && videoId !== prevVideoId.current) {
        prevVideoId.current = videoId;
        player.loadVideoById({
          videoId: videoId,
          startSeconds: currentTime || 0
        });
        if (isPlaying) {
          player.playVideo();
        }
        return;
      }

      // Handle time changes (only if significant)
      if (Math.abs(currentTime - prevCurrentTime.current) > 2) {
        prevCurrentTime.current = currentTime;
        player.seekTo(currentTime, true);
      }

      // Handle play/pause changes
      if (isPlaying !== prevIsPlaying.current) {
        prevIsPlaying.current = isPlaying;
        isPlaying ? player.playVideo() : player.pauseVideo();
      }
    } catch (err) {
      console.error("YouTube Player sync error:", err);
    }
  }, [videoId, currentTime, isPlaying, internalReady]);

  return (
    <YouTube
      videoId={videoId}
      opts={{
        height: '360',
        width: '640',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1
        }
      }}
      onReady={handleReady}
      onStateChange={onStateChange}
      onError={onError}
    />
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.videoId === nextProps.videoId &&
    prevProps.isPlaying === nextProps.isPlaying &&
    Math.abs(prevProps.currentTime - nextProps.currentTime) < 2
  );
};

export const YouTubePlayer = React.memo(YouTubePlayerComponent, areEqual);