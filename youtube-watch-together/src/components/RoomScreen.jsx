import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiCopy, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { VideoSearch } from './VideoSearch';
import { VideoQueue } from './VideoQueue';
import { ChatWindow } from './ChatWindow';
import { VoiceChat } from './VoiceChat';
import { PersistentYouTubePlayer } from './PersistentYouTubePlayer';
import styles from '../styles/RoomScreen.module.css';

export const RoomScreen = ({
  roomCode,
  username,
  videoQueue,
  chatMessages,
  playbackState,
  users,
  searchResults,
  error,
  message,
  onSearchChange,
  updatePlaybackState,
  onSearchSubmit,
  onAddToQueue,
  onMessageChange,
  onSendMessage,
  onPushToTalk,
  onPlayerReady,
  handlePlayerStateChange,
  onLeaveRoom,
  removeFromQueue
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sidebarToggleRef = useRef(null);

  // Mobile detection and responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Enhanced add to queue handler with notifications
  const handleAddToQueue = useCallback((video) => {
    try {
      onAddToQueue(video);
      
      // Show brief success feedback
      const notification = document.createElement('div');
      notification.className = 'room-queue-notification room-success';
      notification.textContent = `Added "${video.title}" to queue`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error adding video to queue:', error);
      
      // Show error feedback
      const notification = document.createElement('div');
      notification.className = 'room-queue-notification room-error';
      notification.textContent = 'Failed to add video to queue';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  }, [onAddToQueue]);

  const handleSelectVideo = useCallback((videoId) => {
    if (videoId !== playbackState.currentVideo) {
      updatePlaybackState({
        currentVideo: videoId,
        isPlaying: true,
        currentTime: 0
      });
    }
  }, [playbackState.currentVideo, updatePlaybackState]);

  const handleDeleteVideo = useCallback((videoId) => {
    const isCurrentlyPlaying = playbackState.currentVideo === videoId;
    const currentIndex = videoQueue.findIndex(v => v.id === videoId);
    
    removeFromQueue(videoId);

    if (isCurrentlyPlaying) {
      // Find next video to play
      let nextVideo = null;
      
      // Try to get the video that was after the deleted one
      if (currentIndex < videoQueue.length - 1) {
        nextVideo = videoQueue[currentIndex + 1];
      } 
      // If that was the last video, try to get the first video
      else if (videoQueue.length > 1) {
        nextVideo = videoQueue[0];
      }
      
      updatePlaybackState({
        currentVideo: nextVideo?.id || null,
        isPlaying: !!nextVideo,
        currentTime: 0
      });
    }
  }, [playbackState.currentVideo, removeFromQueue, updatePlaybackState, videoQueue]);

  // Auto-close sidebar on mobile when video starts playing
  useEffect(() => {
    if (playbackState.currentVideo && isMobile) {
      setIsSidebarOpen(false);
    }
  }, [playbackState.currentVideo, isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Enhanced members list with online indicators
  const MembersList = ({ users }) => {
    const userEntries = Object.entries(users);
    const speakingCount = userEntries.filter(([, user]) => user.isSpeaking).length;
    
    return (
      <div className={styles.roomMembersContent}>
        <div className={styles.roomMembersHeader}>
          <h4>Members Online ({userEntries.length})</h4>
          {speakingCount > 0 && (
            <span className={styles.roomSpeakingCount}>{speakingCount} speaking</span>
          )}
        </div>
        
        <ul className={styles.roomMembersList}>
          {userEntries.map(([id, user]) => (
            <li key={id} className={`${styles.roomMemberItem} ${user.isSpeaking ? styles.roomMemberSpeaking : ''}`}>
              <div className={styles.roomMemberInfo}>
                <div className={styles.roomMemberAvatar}>
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className={styles.roomMemberName}>{user.name}</span>
                {user.name === username && (
                  <span className={styles.roomYouBadge}>You</span>
                )}
              </div>
              
              <div className={styles.roomMemberStatus}>
                <div className={`${styles.roomStatusDot} ${user.isSpeaking ? styles.roomStatusSpeaking : styles.roomStatusOnline}`}></div>
                {user.isSpeaking && (
                  <span className={styles.roomSpeakingIndicator}>🎤</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Enhanced room info panel
  const RoomInfoPanel = ({ roomCode, username, onLeaveRoom }) => {
    const handleCopyRoomCode = useCallback(async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(roomCode);
          
          // Show success feedback
          const button = document.querySelector(`.${styles.roomCopyCodeBtn}`);
          if (button) {
            const originalText = button.textContent;
            button.textContent = '✓';
            button.style.color = 'var(--success-color)';
            
            setTimeout(() => {
              button.textContent = originalText;
              button.style.color = '';
            }, 1500);
          }
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = roomCode;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } catch (error) {
        console.error('Failed to copy room code:', error);
      }
    }, [roomCode]);

    return (
      <div className={styles.roomSidebarInfoPanel}>
        <div className={styles.roomHeaderInfo}>
          <h3>Watch Together</h3>
          <div className={styles.roomStatusInfo}>
            <span className={`${styles.roomStatusIndicator} ${styles.roomStatusOnline}`}></span>
            <span>Connected</span>
          </div>
        </div>
        
        <div className={styles.roomInfoBlock}>
          <h4>Room Code</h4>
          <div className={styles.roomCodeContainer}>
            <p>{roomCode}</p>
            <button 
              className={styles.roomCopyCodeBtn}
              onClick={handleCopyRoomCode}
              title="Copy room code"
              type="button"
            >
              <FiCopy />
            </button>
          </div>
        </div>
        
        <div className={styles.roomInfoBlock}>
          <h4>Your Name</h4>
          <p className={styles.roomUsernameDisplay}>{username}</p>
        </div>
        
        <button onClick={onLeaveRoom} className={styles.roomLeaveButtonSidebar} type="button">
          Leave Room
        </button>
      </div>
    );
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      
      // Focus search with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.room-search-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleSidebar]);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.querySelector(`.${styles.roomSidebar}`);
        const toggle = document.querySelector(`.${styles.roomSidebarToggle}`);
        
        if (sidebar && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen, isMobile]);

  return (
    <div className={styles.roomScreenWrapper}>
      {/* Main content column */}
      <main className={`${styles.roomMainContent} ${isSidebarOpen ? styles.roomMainContentWithSidebar : ''}`}>
        <div className={styles.roomTopSearchContainer}>
          <VideoSearch
            searchResults={searchResults}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            onAddToQueue={handleAddToQueue}
          />
        </div>

        <div className={styles.roomPlayerContainer}>
          {playbackState.currentVideo ? (
            <PersistentYouTubePlayer
              videoId={playbackState.currentVideo}
              isPlaying={playbackState.isPlaying}
              currentTime={playbackState.currentTime}
              onReady={onPlayerReady}
              onStateChange={handlePlayerStateChange}
            />
          ) : (
            <div className={styles.roomPlayerPlaceholder}>
              <div className={styles.roomPlaceholderContent}>
                <div className={styles.roomPlaceholderIcon}>🎬</div>
                <h3>Welcome to the room, {username}!</h3>
                <p>Search for a video above and add it to the queue to start watching together.</p>
                <div className={styles.roomQuickActions}>
                  <button 
                    className={styles.roomQuickActionBtn}
                    onClick={() => document.querySelector('.room-search-input')?.focus()}
                    type="button"
                  >
                    🔍 Start Searching
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.roomBottomQueueContainer}>
          <div className={styles.roomQueueHeader}>
            <h3>
              Queue 
              <span className={styles.roomQueueCount}>({videoQueue.length})</span>
            </h3>
            {videoQueue.length > 0 && (
              <div className={styles.roomQueueControls}>
                <button 
                  className={styles.roomClearQueueBtn}
                  onClick={() => {
                    if (confirm('Clear entire queue?')) {
                      videoQueue.forEach(video => removeFromQueue(video.id));
                    }
                  }}
                  title="Clear queue"
                  type="button"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <VideoQueue
            videos={videoQueue}
            currentVideo={playbackState.currentVideo}
            onSelectVideo={handleSelectVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        </div>
      </main>
      
      {/* Error display */}
      {error && (
        <div className={`room-error-message ${styles.roomGlobalError}`}>
          <span>⚠️ {error}</span>
          <button onClick={() => window.location.reload()} type="button">
            Retry
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.roomSidebar} ${isSidebarOpen ? styles.roomSidebarOpen : ''}`}>
        <button 
          ref={sidebarToggleRef}
          className={styles.roomSidebarToggle}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={`${isSidebarOpen ? 'Close' : 'Open'} sidebar (Ctrl+B)`}
          type="button"
        >
          <FiChevronLeft />
        </button>
        
        <div className={styles.roomSidebarInner}>
          <RoomInfoPanel 
            roomCode={roomCode}
            username={username}
            onLeaveRoom={onLeaveRoom}
          />

          <nav className={styles.roomTabNav} role="tablist">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`${styles.roomTabButton} ${activeTab === 'chat' ? styles.roomTabActive : ''}`}
              aria-pressed={activeTab === 'chat'}
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="room-chat-panel"
              type="button"
            >
              <FiMessageSquare />
              <span>Chat</span>
              {chatMessages.length > 0 && (
                <span className={styles.roomTabBadge} aria-label={`${chatMessages.length} messages`}>
                  {chatMessages.length > 99 ? '99+' : chatMessages.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`${styles.roomTabButton} ${activeTab === 'members' ? styles.roomTabActive : ''}`}
              aria-pressed={activeTab === 'members'}
              role="tab"
              aria-selected={activeTab === 'members'}
              aria-controls="room-members-panel"
              type="button"
            >
              <FiUsers />
              <span>Members</span>
              <span className={styles.roomTabBadge} aria-label={`${Object.keys(users).length} members`}>
                {Object.keys(users).length}
              </span>
            </button>
          </nav>

          <div className={styles.roomPanels}>
            {activeTab === 'chat' && (
              <div id="room-chat-panel" role="tabpanel" aria-labelledby="room-chat-tab" className={styles.roomPanel}>
                <ChatWindow
                  messages={chatMessages}
                  message={message}
                  onMessageChange={onMessageChange}
                  onSendMessage={onSendMessage}
                  currentUser={username}
                />
              </div>
            )}
            {activeTab === 'members' && (
              <div id="room-members-panel" role="tabpanel" aria-labelledby="room-members-tab" className={styles.roomPanel}>
                <MembersList users={users} />
              </div>
            )}
          </div>
          
          <div className={styles.roomVoiceChatBar}>
            <VoiceChat
              users={users}
              isSpeaking={users[username]?.isSpeaking || false}
              onPushToTalk={onPushToTalk}
            />
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && isMobile && (
        <div 
          className={styles.roomSidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};