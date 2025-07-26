import { useState } from 'react';

export const VideoSearch = ({
  searchResults,
  onSearchChange,
  onSearchSubmit,
  onAddToQueue
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearching) return;

    setIsSearching(true);
    setNotification(null);
    try {
      await onSearchSubmit();
    } catch (error) {
      setNotification({ message: error.message || 'Search failed', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToQueue = (video) => {
    onAddToQueue(video);
    setNotification({
      message: `'${video.title}' added to queue!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="video-search panel-content">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search YouTube"
          onChange={(e) => onSearchChange(e.target.value)}
          required
          minLength={2}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? '...' : 'Search'}
        </button>
      </form>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="search-results">
        {searchResults.map((video) => (
          <div key={video.id} className="video-list-item">
            <img
              src={video.thumbnail}
              alt={video.title}
              loading="lazy"
            />
            <div className="info">
              <h4>{video.title}</h4>
              <p>{video.channel}</p>
            </div>
            <button className="action-button" onClick={() => handleAddToQueue(video)}>
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
