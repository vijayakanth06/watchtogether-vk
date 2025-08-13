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
  const [copyFeedback, setCopyFeedback] = useState('');
  const sidebarToggleRef = useRef(null);

  // Mobile detection and responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-open sidebar on desktop, but keep user preference on mobile
      if (!mobile && window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle sidebar with Ctrl+B
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
      
      // Switch tabs with Ctrl+1/2
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('chat');
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('members');
      }
      
      // Close sidebar with Escape on mobile
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isSidebarOpen]);

  // Enhanced add to queue handler with notifications
  const handleAddToQueue = useCallback((video) => {
    try {
      onAddToQueue(video);
      
      // Show brief success feedback
      showNotification(`Added "${video.title.substring(0, 30)}..." to queue`, 'success');
      
    } catch (error) {
      console.error('Error adding video to queue:', error);
      showNotification('Failed to add video to queue', 'error');
    }
  }, [onAddToQueue]);

  // Notification system
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `room-notification room-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
      background: ${type === 'success' ? 'var(--primary-red)' : type === 'error' ? 'var(--dark-red)' : 'var(--mid-gray)'};
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  // Video selection handler
  const handleSelectVideo = useCallback((videoId) => {
    if (videoId !== playbackState.currentVideo) {
      updatePlaybackState({
        currentVideo: videoId,
        isPlaying: true,
        currentTime: 0
      });
      
      // Close sidebar on mobile when video starts
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    }
  }, [playbackState.currentVideo, updatePlaybackState, isMobile]);

  // Video deletion handler
  const handleDeleteVideo = useCallback((videoId) => {
    const isCurrentlyPlaying = playbackState.currentVideo === videoId;
    const currentIndex = videoQueue.findIndex(v => v.id === videoId);
    
    removeFromQueue(videoId);

    if (isCurrentlyPlaying && videoQueue.length > 1) {
      // Find next video to play
      let nextVideo = null;
      
      // Try to get the video that was after the deleted one
      if (currentIndex < videoQueue.length - 1) {
        nextVideo = videoQueue[currentIndex + 1];
      } 
      // If that was the last video, try to get the first video
      else if (currentIndex > 0) {
        nextVideo = videoQueue[0];
      }
      
      if (nextVideo) {
        updatePlaybackState({
          currentVideo: nextVideo.id,
          isPlaying: true,
          currentTime: 0
        });
      } else {
        updatePlaybackState({
          currentVideo: null,
          isPlaying: false,
          currentTime: 0
        });
      }
    }
  }, [playbackState.currentVideo, removeFromQueue, updatePlaybackState, videoQueue]);

  // Sidebar toggle handler
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Copy room code handler
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
      showNotification('Room code copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy room code:', err);
      showNotification('Failed to copy room code', 'error');
    }
  }, [roomCode]);

  // Leave room handler
  const handleLeaveRoom = useCallback(() => {
    if (confirm('Are you sure you want to leave the room?')) {
      localStorage.removeItem('yt_watch_together_session');
      onLeaveRoom();
    }
  }, [onLeaveRoom]);

  // Clear queue handler
  const handleClearQueue = useCallback(() => {
    if (videoQueue.length === 0) return;
    
    if (confirm(`Clear all ${videoQueue.length} videos from queue?`)) {
      videoQueue.forEach(video => removeFromQueue(video.id));
      showNotification('Queue cleared', 'info');
    }
  }, [videoQueue, removeFromQueue]);

  // Enhanced members list component
  const MembersList = React.memo(({ users }) => {
    const userEntries = Object.entries(users);
    const speakingCount = userEntries.filter(([, user]) => user.isSpeaking).length;
    
    return (
      <div className={styles.roomMembersContent}>
        <div className={styles.roomMembersHeader}>
          <h4>Members Online ({userEntries.length})</h4>
          {speakingCount > 0 && (
            <span className={styles.roomSpeakingCount}>
              {speakingCount} speaking
            </span>
          )}
        </div>
        
        <ul className={styles.roomMembersList}>
          {userEntries.map(([id, user]) => (
            <li 
              key={id} 
              className={`${styles.roomMemberItem} ${user.isSpeaking ? styles.roomMemberSpeaking : ''}`}
            >
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
                <div className={`${styles.roomStatusDot} ${
                  user.isSpeaking ? styles.roomStatusSpeaking : styles.roomStatusOnline
                }`}></div>
                {user.isSpeaking && (
                  <span className={styles.roomSpeakingBadge}>Speaking</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  });

  // Room info panel component
  const RoomInfoPanel = React.memo(({ roomCode, username, onCopyCode, onLeaveRoom, copyFeedback }) => (
    <div className={styles.roomInfoPanel}>
      <div className={styles.roomCodeContainer}>
        <span className={styles.roomCodeDisplay}>{roomCode}</span>
        <button 
          onClick={onCopyCode} 
          className={styles.roomCopyCodeBtn}
          aria-label="Copy room code"
          title="Copy room code"
          type="button"
        >
          <FiCopy />
        </button>
        {copyFeedback && (
          <div className={styles.roomCopyFeedback}>{copyFeedback}</div>
        )}
      </div>
      
      <div className={styles.roomUserInfo}>
        <span>Welcome, <strong>{username}</strong></span>
        <button 
          onClick={onLeaveRoom} 
          className={styles.roomLeaveBtn}
          type="button"
        >
          Leave Room
        </button>
      </div>
    </div>
  ));

  return (
    <div className={styles.roomScreenWrapper}>
      {/* Main Content Area */}
      <main className={styles.roomMainContent}>
        {/* Search Section */}
        <div className={styles.roomTopSearchContainer}>
          <VideoSearch
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            searchResults={searchResults}
            onAddToQueue={handleAddToQueue}
          />
        </div>
        
        {/* Video Player Section */}
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
                <div className={styles.roomPlaceholderIcon}>🎥</div>
                <h3>No video playing</h3>
                <p>Search for a video and add it to the queue to start watching together.</p>
                <div className={styles.roomQuickActions}>
                  <button 
                    className={styles.roomQuickActionBtn}
                    onClick={() => document.querySelector('input[placeholder*="Search"]')?.focus()}
                    type="button"
                  >
                    🔍 Start Searching
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Queue Section */}
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
                  onClick={handleClearQueue}
                  title="Clear entire queue"
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

      {/* Sidebar */}
      <aside className={`${styles.roomSidebar} ${isSidebarOpen ? styles.roomSidebarOpen : ''}`}>
        {/* Sidebar Toggle Button */}
        <button 
          ref={sidebarToggleRef}
          className={styles.roomSidebarToggle}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={`${isSidebarOpen ? 'Close' : 'Open'} sidebar (Ctrl+B)`}
          type="button"
        >
          <FiChevronLeft 
            style={{ 
              transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }} 
          />
        </button>
        
        {/* Sidebar Content */}
        <div className={styles.roomSidebarInner}>
          {/* Room Info Panel */}
          <RoomInfoPanel 
            roomCode={roomCode}
            username={username}
            onCopyCode={handleCopyCode}
            onLeaveRoom={handleLeaveRoom}
            copyFeedback={copyFeedback}
          />

          {/* Tab Navigation */}
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
                <span 
                  className={styles.roomTabBadge} 
                  aria-label={`${chatMessages.length} messages`}
                >
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
              <span 
                className={styles.roomTabBadge} 
                aria-label={`${Object.keys(users).length} members`}
              >
                {Object.keys(users).length}
              </span>
            </button>
          </nav>

          {/* Tab Panels */}
          <div className={styles.roomPanels}>
            {activeTab === 'chat' && (
              <div 
                id="room-chat-panel" 
                role="tabpanel" 
                aria-labelledby="room-chat-tab" 
                className={`${styles.roomPanel} ${styles.roomChatPanel}`}
              >
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
              <div 
                id="room-members-panel" 
                role="tabpanel" 
                aria-labelledby="room-members-tab" 
                className={styles.roomPanel}
              >
                <MembersList users={users} />
              </div>
            )}
          </div>
          
          {/* Voice Chat Bar */}
          <div className={styles.roomVoiceChatBar}>
            <VoiceChat
              users={users}
              isSpeaking={users[username]?.isSpeaking || false}
              onPushToTalk={onPushToTalk}
            />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
        <div 
          className={styles.roomSidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Error Display */}
      {error && (
        <div className={`room-error-message ${styles.roomGlobalError}`}>
          <span>⚠️ {error}</span>
          <button 
            onClick={() => window.location.reload()} 
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Notification Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};