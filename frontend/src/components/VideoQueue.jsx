import { useCallback } from 'react';

const VideoQueue = ({ queue, onRemove, currentUser }) => {
  const canRemove = useCallback(
    (video) => video.addedBy === currentUser,
    [currentUser]
  );

  return (
    <div>
      <h3>Video Queue</h3>
      {queue.length === 0 ? (
        <p>Queue is empty</p>
      ) : (
        <ul>
          {queue.map((video) => (
            <li key={video.id}>
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                width="120" 
                height="90" 
              />
              <div>
                <div>{video.title}</div>
                <div>Added by: {video.addedBy}</div>
                {canRemove(video) && (
                  <button onClick={() => onRemove(video.id)}>Remove</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VideoQueue;