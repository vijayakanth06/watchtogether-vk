import { useState, useEffect, useRef } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import styles from '../styles/VideoSearch.module.css';

export const VideoSearch = ({
  searchResults,
  onSearchChange,
  onSearchSubmit,
  onAddToQueue,
  onExpansionChange
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Debounce search query for dynamic searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleDynamicSearch();
    }
  }, [debouncedQuery]);

  // Notify parent about expansion changes
  useEffect(() => {
    onExpansionChange?.(isExpanded);
  }, [isExpanded, onExpansionChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

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
      
      // Auto-clear error notification
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 4000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value) => {
    setSearchQuery(value);
    onSearchChange(value);
    
    // Clear any existing notification when user starts typing
    if (notification) {
      setNotification(null);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    }
    
    // Expand search box when user starts typing
    if (value.trim() && !isExpanded) {
      setIsExpanded(true);
    } else if (!value.trim() && isExpanded && !searchResults.length) {
      // Only collapse if no results are shown
      setIsExpanded(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearching || !searchQuery.trim()) return;

    setIsSearching(true);
    setNotification(null);
    
    try {
      await onSearchSubmit();
      // Keep expanded if we have results
      if (searchResults.length > 0) {
        setIsExpanded(true);
      }
    } catch (error) {
      setNotification({ 
        message: error.message || 'Search failed', 
        type: 'error' 
      });
      
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 4000);
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
    
    // Auto-clear success notification and optionally collapse search
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const handleFocus = () => {
    if (searchQuery.trim() || searchResults.length > 0) {
      setIsExpanded(true);
    }
  };

  const handleBlur = (e) => {
    // Don't collapse if clicking on search results or related elements
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (
      relatedTarget.closest(`.${styles.searchResultsContainer}`) || 
      relatedTarget.closest(`.${styles.videoSearchWrapper}`)
    )) {
      return;
    }
    
    // Don't collapse immediately - give time for potential clicks
    searchTimeoutRef.current = setTimeout(() => {
      if (!searchQuery.trim() && !searchResults.length) {
        setIsExpanded(false);
      }
    }, 200);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsExpanded(false);
    onSearchChange('');
    setNotification(null);
    
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    searchInputRef.current?.blur();
  };

  const handleResultsInteraction = () => {
    // Clear any pending blur timeout when interacting with results
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Determine if results should be visible
  const showResults = isExpanded && (searchResults.length > 0 || (debouncedQuery.length >= 2 && !isSearching));

  return (
    <div className={styles.videoSearchWrapper}>
      <form onSubmit={handleSubmit} className={styles.searchFormContainer}>
        <div className={styles.searchInputWrapper}>
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
            className={`${styles.searchInputField} room-search-input`}
            autoComplete="off"
          />
          
          {searchQuery && (
            <button 
              type="button" 
              className={styles.clearSearchButton}
              onClick={clearSearch}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <FiX />
            </button>
          )}
          
          {isSearching && (
            <div className={styles.searchLoadingIndicator}>
              <div className={styles.loadingSpinnerSmall}></div>
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className={styles.searchSubmitButton}
        >
          {isSearching ? '⋯' : <><FiSearch /> Search</>}
        </button>
      </form>
      
      {notification && (
        <div className={`${styles.searchNotification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      {/* Search Results - Overlay positioning */}
      <div 
        className={`${styles.searchResultsContainer} ${showResults ? styles.searchResultsVisible : ''}`}
        onMouseDown={handleResultsInteraction}
        onFocus={handleResultsInteraction}
      >
        {searchResults.length > 0 && (
          <>
            <div className={styles.resultsHeaderSection}>
              <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              <button 
                className={styles.collapseResultsBtn}
                onClick={clearSearch}
                title="Close search"
                type="button"
              >
                <FiX />
              </button>
            </div>
            
            <div className={styles.resultsListContainer}>
              {searchResults.map((video) => (
                <div key={video.id} className={styles.searchResultItemWrapper}>
                  <div className={styles.thumbnailContainerSearch}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className={styles.videoThumbnailSearch}
                    />
                    {video.duration && (
                      <span className={styles.durationBadgeSearch}>{video.duration}</span>
                    )}
                  </div>
                  
                  <div className={styles.infoContainerSearch}>
                    <h4 title={video.title}>{video.title}</h4>
                    <div className={styles.videoMetaSearch}>
                      <p className={styles.channelNameSearch}>{video.channel || 'Unknown Channel'}</p>
                      {video.viewCount && (
                        <p className={styles.viewCountSearch}>{video.viewCount} views</p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className={styles.addToQueueButton}
                    onClick={() => handleAddToQueue(video)}
                    title={`Add "${video.title}" to queue`}
                    type="button"
                  >
                    <span className={styles.btnIconSearch}>+</span>
                    <span className={styles.btnTextSearch}>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        
        {debouncedQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className={styles.noResultsContainer}>
            <div className={styles.noResultsIconSearch}>🔍</div>
            <p>No videos found for "{debouncedQuery}"</p>
            <p>Try different keywords or check your spelling</p>
          </div>
        )}
        
        {debouncedQuery.length >= 2 && isSearching && (
          <div className={styles.searchingStateContainer}>
            <div className={styles.searchLoadingLargeContainer}>
              <div className={styles.loadingSpinnerLarge}></div>
            </div>
            <p>Searching for "{debouncedQuery}"...</p>
          </div>
        )}
      </div>
    </div>
  );
};