import React, { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';

export const PersistentYouTubePlayer = React.memo(({
  videoId,
  isPlaying,
  currentTime,
  onReady,
  onStateChange
}) => {
  const playerRef = useRef(null);
  const [internalReady, setInternalReady] = useState(false);
  const lastVideoId = useRef(null);
  const lastCurrentTime = useRef(0);
  const lastIsPlaying = useRef(false);
  const ignoreStateChanges = useRef(false);
  const playerInitialized = useRef(false);

  const handleReady = (event) => {
    if (playerInitialized.current) return;
    
    playerRef.current = event.target;
    setInternalReady(true);
    lastVideoId.current = videoId;
    lastCurrentTime.current = currentTime;
    lastIsPlaying.current = isPlaying;
    playerInitialized.current = true;
    onReady?.(event);
  };

  const handleStateChange = (event) => {
    if (ignoreStateChanges.current) {
      ignoreStateChanges.current = false;
      return;
    }
    onStateChange?.(event.data);
  };

  useEffect(() => {
    if (!internalReady || !playerRef.current) return;

    try {
      // Only handle video changes
      if (videoId && videoId !== lastVideoId.current) {
        lastVideoId.current = videoId;
        ignoreStateChanges.current = true;
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: currentTime || 0
        });
        if (isPlaying) {
          playerRef.current.playVideo();
        }
        return;
      }

      // Handle time changes (only if significant)
      if (Math.abs(currentTime - lastCurrentTime.current) > 2) {
        lastCurrentTime.current = currentTime;
        ignoreStateChanges.current = true;
        playerRef.current.seekTo(currentTime, true);
      }

      // Handle play/pause changes
      if (isPlaying !== lastIsPlaying.current) {
        lastIsPlaying.current = isPlaying;
        ignoreStateChanges.current = true;
        isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.error("YouTube Player sync error:", err);
    }
  }, [videoId, currentTime, isPlaying, internalReady]);

  return (
    <div style={{
      width: '800px',
      height: '800px',
      position: 'relative'
    }}>
      <YouTube
        key={`player-${videoId || 'empty'}`} // Only remount when videoId changes
        videoId={videoId}
        opts={{
          height: '650',
          width: '640',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin // Important for CORS
          }
        }}
        onReady={handleReady}
        onStateChange={handleStateChange}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only update if these specific props change meaningfully
  const videoChanged = prevProps.videoId !== nextProps.videoId;
  const playingChanged = prevProps.isPlaying !== nextProps.isPlaying;
  const timeChanged = Math.abs(prevProps.currentTime - nextProps.currentTime) > 2;
  
  return !videoChanged && !playingChanged && !timeChanged;
});