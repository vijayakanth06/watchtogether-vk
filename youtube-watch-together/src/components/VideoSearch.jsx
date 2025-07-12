import { useState } from 'react';

export const VideoSearch = ({
  searchResults,
  onSearchChange,
  onSearchSubmit,
  onAddToQueue
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearching) return;
    
    setIsSearching(true);
    setSearchError(null);
    try {
      await onSearchSubmit();
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search YouTube"
          onChange={(e) => onSearchChange(e.target.value)}
          required
          minLength={2}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {searchError && <div style={{ color: 'red' }}>{searchError}</div>}

      <div>
        {searchResults.map((video) => (
          <div key={video.id}>
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              width="120" 
              height="90" 
              loading="lazy"
            />
            <div>
              <h4>{video.title}</h4>
              <p>{video.channel}</p>
              <button onClick={() => onAddToQueue(video)}>
                Add to Queue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};