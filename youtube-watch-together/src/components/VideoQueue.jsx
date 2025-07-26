/*
* =================================================================
* components/VideoQueue.jsx
*
* Styled to work as a list within the sidebar.
* Added clear visual distinction for the currently playing video.
* =================================================================
*/
export const VideoQueue = ({ videos, currentVideo, onSelectVideo, onDeleteVideo }) => {
  if (!videos || videos.length === 0) {
    return (
        <div className="panel-content empty-queue">
            <p>The queue is empty.</p>
            <p>Use the 'Search' tab to find and add videos!</p>
        </div>
    );
  }

  return (
    <ul className="video-queue panel-content">
      {videos.map((video) => (
        <li 
          key={video.id}
          className={`video-list-item ${video.id === currentVideo ? 'active' : ''}`}
        >
          <div className="item-main" onClick={() => onSelectVideo(video.id)}>
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              loading="lazy"
            />
            <div className="info">
              <h4>{video.title}</h4>
              <p>Added by: {video.addedBy}</p>
            </div>
          </div>
          <button 
            onClick={() => onDeleteVideo(video.id)}
            className="delete-button"
            title="Remove from queue"
          >
            &times;
          </button>
        </li>
      ))}
    </ul>
  );
};
