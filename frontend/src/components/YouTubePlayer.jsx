import { useEffect } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = ({
  videoId,
  isPlaying,
  currentTime,
  onReady,
  onStateChange,
  onTimeUpdate
}) => {
  const playerRef = useRef(null);

  const opts = {
    height: '360',
    width: '640',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1
    },
  };

  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current || !currentTime) return;
    const playerTime = playerRef.current.getCurrentTime();
    if (Math.abs(playerTime - currentTime) > 1) {
      playerRef.current.seekTo(currentTime, true);
    }
  }, [currentTime]);

  const handleReady = (event) => {
    playerRef.current = event.target;
    onReady(event);
  };

  const handleStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      const interval = setInterval(() => {
        if (playerRef.current) {
          onTimeUpdate(playerRef.current.getCurrentTime());
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    onStateChange(event);
  };

  return (
    <YouTube
      videoId={videoId}
      opts={opts}
      onReady={handleReady}
      onStateChange={handleStateChange}
    />
  );
};

export default YouTubePlayer;