import React from 'react';
import { FiPlay, FiTrash2, FiFilm } from 'react-icons/fi';
import styles from '../styles/VideoQueue.module.css';

/**
 * A component that displays the list of videos in the room's queue.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.videos - An array of video objects to display in the queue.
 * Each video object should have: id, thumbnail, title, channelTitle.
 * @param {string|null} props.currentVideo - The ID of the video that is currently playing.
 * @param {Function} props.onSelectVideo - Callback function to play a video from the queue.
 * @param {Function} props.onDeleteVideo - Callback function to remove a video from the queue.
 */
export const VideoQueue = React.memo(({ videos, currentVideo, onSelectVideo, onDeleteVideo }) => {

  // Handler for deleting a video. Prevents the click from also selecting the video.
  const handleDelete = (e, videoId) => {
    e.stopPropagation(); // Prevent the item's onClick from firing
    onDeleteVideo(videoId);
  };

  if (!videos || videos.length === 0) {
    return (
      <div className={`${styles.videoQueueWrapper} ${styles.emptyQueueState}`}>
        <div className={styles.emptyQueueContent}>
          <div className={styles.emptyQueueIcon}><FiFilm /></div>
          <p className={styles.emptyQueueTitle}>The queue is empty.</p>
          <span className={styles.emptyQueueSubtitle}>Search for a video to get started.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoQueueWrapper}>
      <ul className={styles.queueListContainer}>
        {videos.map((video, index) => {
          const isPlaying = video.id === currentVideo;
          // Construct the className string, applying 'nowPlaying' if the video is the current one.
          const itemClassName = `${styles.queueItemWrapper} ${isPlaying ? styles.queueItemNowPlaying : ''}`;

          return (
            <li
              key={video.id}
              className={itemClassName}
              onClick={() => onSelectVideo(video.id)}
              aria-current={isPlaying ? 'true' : 'false'}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectVideo(video.id)}
            >
              <div className={styles.itemContentWrapper}>
                <div className={styles.thumbnailContainerQueue}>
                  <img 
                    src={video.thumbnail} 
                    alt={`Thumbnail for ${video.title}`} 
                    className={styles.thumbnailImageQueue}
                    // Add a fallback for broken image links
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/120x90/141414/ffffff?text=Video'; }}
                  />
                  {isPlaying && (
                    <div className={styles.playIconOverlayQueue}>
                      <FiPlay className={styles.playIconQueue} />
                    </div>
                  )}
                  <span className={styles.queuePositionBadge}>{index + 1}</span>
                </div>

                <div className={styles.videoDetailsQueue}>
                  <p className={styles.titleQueue} title={video.title}>
                    {video.title}
                  </p>
                  <p className={styles.channelQueue}>{video.channelTitle}</p>
                </div>
              </div>

              <div className={styles.itemActionsQueue}>
                <button
                  className={styles.deleteButtonQueue}
                  onClick={(e) => handleDelete(e, video.id)}
                  aria-label={`Remove ${video.title} from queue`}
                  title="Remove from queue"
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});