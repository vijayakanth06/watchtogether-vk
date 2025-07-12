import { useEffect, useRef } from 'react';

const VideoControls = ({ 
  isPlaying, 
  currentTime, 
  duration, 
  onPlayPause, 
  onSeek, 
  onNext 
}) => {
  const progressRef = useRef(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.value = currentTime;
      progressRef.current.max = duration;
    }
  }, [currentTime, duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div>
      <div>
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          ref={progressRef}
          min="0"
          max={duration}
          step="1"
          onChange={(e) => onSeek(parseFloat(e.target.value))}
        />
        <span>{formatTime(duration)}</span>
      </div>
      <div>
        <button onClick={onPlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={onNext}>Next Video</button>
      </div>
    </div>
  );
};

export default VideoControls;