import { useState } from 'react';
import React from 'react';
const Notification = ({ message, type }) => {
  const style = {
    padding: '10px',
    margin: '10px 0',
    borderRadius: '6px',
    color: type === 'error' ? '#fff' : '#155724',
    backgroundColor: type === 'error' ? '#dc3545' : '#d4edda',
    border: `1px solid ${type === 'error' ? '#b71c1c' : '#c3e6cb'}`
  };

  return <div style={style}>{message}</div>;
};

export const VideoSearch = ({
  searchResults,
  onSearchChange,
  onSearchSubmit,
  onAddToQueue
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      await onSearchSubmit();
    } catch (error) {
      setSearchError(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToQueue = async (video) => {
    try {
      await onAddToQueue(video);
      setNotification({
        message: `${video.title} added to queue!`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        message: `Failed to add video: ${error.message}`,
        type: 'error'
      });
    }

    // Auto dismiss notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div>
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
        />
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search YouTube"
          onChange={(e) => onSearchChange(e.target.value)}
          required
          minLength={2}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {searchError}
        </div>
      )}

      <div>
        {searchResults.map((video) => (
          <div
            key={video.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
              border: '1px solid #ddd',
              padding: '10px',
              borderRadius: '6px'
            }}
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              width="120"
              height="90"
              loading="lazy"
              style={{ marginRight: '12px' }}
            />
            <div>
              <h4 style={{ margin: 0 }}>{video.title}</h4>
              <p style={{ margin: '4px 0' }}>{video.channel}</p>
              <button onClick={() => handleAddToQueue(video)}>
                Add to Queue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
