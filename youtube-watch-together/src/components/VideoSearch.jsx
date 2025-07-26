import { useState, useEffect, useRef } from 'react';

export const VideoSearch = ({
  searchResults,
  onSearchChange,
  onSearchSubmit,
  onAddToQueue
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounce search query for dynamic searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleDynamicSearch();
    }
  }, [debouncedQuery]);

  const handleDynamicSearch = async () => {
    if (isSearching || !debouncedQuery.trim()) return;

    setIsSearching(true);
    setNotification(null);
    
    try {
      onSearchChange(debouncedQuery);
      await onSearchSubmit();
    } catch (error) {
      setNotification({ 
        message: error.message || 'Search failed', 
        type: 'error' 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value) => {
    setSearchQuery(value);
    onSearchChange(value);
    
    // Expand search box when user starts typing
    if (value.trim() && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearching || !searchQuery.trim()) return;

    setIsSearching(true);
    setNotification(null);
    
    try {
      await onSearchSubmit();
    } catch (error) {
      setNotification({ 
        message: error.message || 'Search failed', 
        type: 'error' 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToQueue = (video) => {
    onAddToQueue(video);
    
    // Show success notification
    setNotification({
      message: `'${video.title}' added to queue!`,
      type: 'success'
    });
    
    // Auto-close search box after adding video
    setTimeout(() => {
      setIsExpanded(false);
      setSearchQuery('');
      setDebouncedQuery('');
      onSearchChange('');
      
      // Clear notification after animation
      setTimeout(() => setNotification(null), 300);
    }, 1500); // Show success message for 1.5s before closing
  };

  const handleFocus = () => {
    if (searchQuery.trim()) {
      setIsExpanded(true);
    }
  };

  const handleBlur = () => {
    // Don't collapse if there are search results or user is actively searching
    if (!searchResults.length && !searchQuery.trim()) {
      setTimeout(() => setIsExpanded(false), 200);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsExpanded(false);
    onSearchChange('');
    setNotification(null);
    searchInputRef.current?.blur();
  };

  return (
    <div className={`video-search panel-content ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search YouTube videos..."
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required
            minLength={2}
            className="search-input"
          />
          
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          
          {isSearching && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="search-submit-btn"
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </form>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className={`search-results ${isExpanded && searchResults.length ? 'visible' : ''}`}>
        {searchResults.length > 0 && (
          <div className="results-header">
            <span>{searchResults.length} results</span>
            {searchQuery && (
              <button 
                className="collapse-btn" 
                onClick={clearSearch}
                title="Close search"
              >
                ✕
              </button>
            )}
          </div>
        )}
        
        <div className="results-list">
          {searchResults.map((video) => (
            <div key={video.id} className="video-list-item search-result-item">
              <img
                src={video.thumbnail}
                alt={video.title}
                loading="lazy"
                className="video-thumbnail"
              />
              <div className="info">
                <h4 title={video.title}>{video.title}</h4>
                <p>{video.channel}</p>
                {video.duration && <span className="duration">{video.duration}</span>}
              </div>
              <button 
                className="action-button add-to-queue-btn" 
                onClick={() => handleAddToQueue(video)}
                title="Add to queue"
              >
                <span className="btn-icon">+</span>
                <span className="btn-text">Add</span>
              </button>
            </div>
          ))}
        </div>
        
        {debouncedQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="no-results">
            <p>No videos found for "{debouncedQuery}"</p>
            <p>Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
};