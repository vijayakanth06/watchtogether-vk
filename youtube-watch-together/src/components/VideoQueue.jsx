import { useState } from 'react';

export const VideoQueue = ({ videos, currentVideo, onSelectVideo, onDeleteVideo }) => {
  const [deletingIds, setDeletingIds] = useState(new Set());

  const handleDelete = async (videoId) => {
    // Add visual feedback for deletion
    setDeletingIds(prev => new Set([...prev, videoId]));
    
    // Small delay for animation
    setTimeout(() => {
      onDeleteVideo(videoId);
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }, 200);
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="panel-content empty-queue">
        <div className="empty-queue-content">
          <div className="empty-icon">🎵</div>
          <p>The queue is empty</p>
          <p>Search for videos above to get started!</p>
        </div>
      </div>
    );
  }

  const getCurrentVideoIndex = () => {
    return videos.findIndex(video => video.id === currentVideo);
  };

  const currentIndex = getCurrentVideoIndex();

  return (
    <ul className="video-queue panel-content">
      {videos.map((video, index) => {
        const isCurrentVideo = video.id === currentVideo;
        const isNextUp = index === currentIndex + 1;
        const isPrevious = index < currentIndex;
        const isDeleting = deletingIds.has(video.id);
        
        return (
          <li 
            key={video.id}
            className={`video-list-item queue-item ${isCurrentVideo ? 'active' : ''} ${isNextUp ? 'next-up' : ''} ${isPrevious ? 'played' : ''} ${isDeleting ? 'deleting' : ''}`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              opacity: isDeleting ? 0.5 : 1,
              transform: isDeleting ? 'scale(0.95)' : 'scale(1)'
            }}
          >
            <div className="queue-position">
              {isCurrentVideo ? (
                <div className="now-playing-indicator">
                  <div className="playing-bars">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </div>
              ) : (
                <span className="position-number">{index + 1}</span>
              )}
            </div>

            <div className="item-main" onClick={() => !isDeleting && onSelectVideo(video.id)}>
              <div className="thumbnail-container">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  loading="lazy"
                  className="video-thumbnail"
                />
                {isCurrentVideo && (
                  <div className="play-overlay">
                    <div className="play-button">▶</div>
                  </div>
                )}
                {video.duration && (
                  <span className="duration-badge">{video.duration}</span>
                )}
              </div>
              
              <div className="info">
                <h4 title={video.title}>{video.title}</h4>
                <div className="video-meta">
                  <p className="channel">{video.channel || 'Unknown Channel'}</p>
                  <p className="added-by">Added by: <span className="username">{video.addedBy}</span></p>
                </div>
                {isNextUp && <div className="next-up-badge">Next up</div>}
                {isPrevious && <div className="played-badge">Played</div>}
              </div>
            </div>
            
            <button 
              onClick={() => handleDelete(video.id)}
              className="delete-button"
              title={`Remove "${video.title}" from queue`}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : '×'}
            </button>
          </li>
        );
      })}
      
      {videos.length > 0 && (
        <div className="queue-summary">
          <div className="summary-stats">
            <span className="total-videos">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
            {currentIndex >= 0 && (
              <span className="current-position">
                Playing: {currentIndex + 1} of {videos.length}
              </span>
            )}
          </div>
          
          {currentIndex >= 0 && currentIndex < videos.length - 1 && (
            <div className="up-next">
              <span>Up next: {videos.length - currentIndex - 1} video{videos.length - currentIndex - 1 !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </ul>
  );
};