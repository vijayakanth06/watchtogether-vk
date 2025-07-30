import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import styles from '../styles/PersistentYouTubePlayer.module.css';

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
  const ignoreNextStateChange = useRef(false);
  const syncTimeoutRef = useRef(null);
  const isLoadingVideo = useRef(false);

  const handleReady = useCallback((event) => {
    console.log('YouTube Player Ready');
    playerRef.current = event.target;
    setInternalReady(true);
    lastVideoId.current = videoId;
    lastCurrentTime.current = currentTime || 0;
    lastIsPlaying.current = isPlaying;
    onReady?.(event);
  }, [videoId, currentTime, isPlaying, onReady]);

  const handleStateChange = useCallback((event) => {
    if (ignoreNextStateChange.current) {
      ignoreNextStateChange.current = false;
      return;
    }

    const state = event.data;
    console.log('YouTube Player State Change:', state);
    
    // Only report meaningful state changes to parent
    if (state === window.YT.PlayerState.PLAYING || 
        state === window.YT.PlayerState.PAUSED || 
        state === window.YT.PlayerState.ENDED) {
      onStateChange?.(state);
    }
  }, [onStateChange]);

  const handleError = useCallback((event) => {
    console.error('YouTube Player Error:', event.data);
    isLoadingVideo.current = false;
  }, []);

  // Sync player with props
  useEffect(() => {
    if (!internalReady || !playerRef.current || !videoId) return;

    const player = playerRef.current;

    try {
      // Handle video change
      if (videoId !== lastVideoId.current) {
        console.log('Loading new video:', videoId);
        lastVideoId.current = videoId;
        isLoadingVideo.current = true;
        ignoreNextStateChange.current = true;
        
        player.loadVideoById({
          videoId: videoId,
          startSeconds: currentTime || 0
        });
        
        // Wait a bit for video to load before setting play state
        setTimeout(() => {
          isLoadingVideo.current = false;
          if (isPlaying) {
            ignoreNextStateChange.current = true;
            player.playVideo();
          }
          lastIsPlaying.current = isPlaying;
          lastCurrentTime.current = currentTime || 0;
        }, 1000);
        
        return;
      }

      // Don't sync time/play state while loading
      if (isLoadingVideo.current) return;

      // Handle play/pause changes
      if (isPlaying !== lastIsPlaying.current) {
        console.log('Play state change:', isPlaying);
        lastIsPlaying.current = isPlaying;
        ignoreNextStateChange.current = true;
        
        if (isPlaying) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      }

      // Handle time sync (only if significant difference and not user seeking)
      const playerCurrentTime = player.getCurrentTime();
      const timeDifference = Math.abs(currentTime - playerCurrentTime);
      
      if (timeDifference > 3 && Math.abs(currentTime - lastCurrentTime.current) > 1) {
        console.log('Syncing time:', currentTime);
        lastCurrentTime.current = currentTime;
        player.seekTo(currentTime, true);
      }

    } catch (err) {
      console.error('YouTube Player sync error:', err);
      isLoadingVideo.current = false;
    }
  }, [videoId, currentTime, isPlaying, internalReady]);

  // Periodic time sync to keep players in sync
  useEffect(() => {
    if (!internalReady || !playerRef.current || !isPlaying || isLoadingVideo.current) return;

    const syncInterval = setInterval(() => {
      try {
        const player = playerRef.current;
        const playerTime = player.getCurrentTime();
        
        // Update our last known time
        lastCurrentTime.current = playerTime;
        
        // Report time updates to parent occasionally
        if (Math.floor(playerTime) % 5 === 0) {
          onStateChange?.(window.YT.PlayerState.PLAYING);
        }
      } catch (err) {
        console.error('Time sync error:', err);
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [internalReady, isPlaying, onStateChange]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  if (!videoId) {
    return (
      <div className={styles.youTubePlayerWrapper}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#888',
          fontSize: '18px'
        }}>
          No video selected
        </div>
      </div>
    );
  }

  return (
    <div className={styles.youTubePlayerWrapper}>
      <YouTube
        key={`youtube-player-${videoId}`} // Force remount on video change
        videoId={videoId}
        opts={{
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0, // Let us control autoplay
            controls: 1, // Enable player controls
            modestbranding: 1,
            rel: 0,
            fs: 1, // Allow fullscreen
            cc_load_policy: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
            playsinline: 1
          }
        }}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onError={handleError}
        className={styles.youTubePlayerIframe}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.videoId === nextProps.videoId &&
    prevProps.isPlaying === nextProps.isPlaying &&
    Math.abs(prevProps.currentTime - nextProps.currentTime) < 2
  );
});