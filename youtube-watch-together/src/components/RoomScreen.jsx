import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoSearch } from './VideoSearch';
import { VideoQueue } from './VideoQueue';
import { ChatWindow } from './ChatWindow';
import { VoiceChat } from './VoiceChat';
import { PersistentYouTubePlayer } from './PersistentYouTubePlayer';

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
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Enhanced add to queue handler with notifications
  const handleAddToQueue = useCallback((video) => {
    try {
      onAddToQueue(video);
      
      // Show brief success feedback
      const notification = document.createElement('div');
      notification.className = 'queue-notification success';
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
      notification.className = 'queue-notification error';
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
    if (playbackState.currentVideo && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [playbackState.currentVideo]);

  // Enhanced members list with online indicators
  const MembersList = ({ users }) => {
    const userEntries = Object.entries(users);
    const speakingCount = userEntries.filter(([, user]) => user.isSpeaking).length;
    
    return (
      <div className="panel-content">
        <div className="members-header">
          <h4>Members Online ({userEntries.length})</h4>
          {speakingCount > 0 && (
            <span className="speaking-count">{speakingCount} speaking</span>
          )}
        </div>
        
        <ul className="members-list">
          {userEntries.map(([id, user]) => (
            <li key={id} className={`member-item ${user.isSpeaking ? 'speaking' : ''}`}>
              <div className="member-info">
                <div className="member-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="member-name">{user.name}</span>
                {user.name === username && (
                  <span className="you-badge">You</span>
                )}
              </div>
              
              <div className="member-status">
                <div className={`status-dot ${user.isSpeaking ? 'speaking' : 'online'}`}></div>
                {user.isSpeaking && (
                  <span className="speaking-indicator">🎤</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Enhanced room info panel
  const RoomInfoPanel = ({ roomCode, username, onLeaveRoom }) => (
    <div className="sidebar-info-panel">
      <div className="room-header">
        <h3>Watch Together</h3>
        <div className="room-status">
          <span className="status-indicator online"></span>
          <span>Connected</span>
        </div>
      </div>
      
      <div className="info-block">
        <h4>Room Code</h4>
        <div className="room-code-container">
          <p>{roomCode}</p>
          <button 
            className="copy-code-btn"
            onClick={() => navigator.clipboard?.writeText(roomCode)}
            title="Copy room code"
          >
            📋
          </button>
        </div>
      </div>
      
      <div className="info-block">
        <h4>Your Name</h4>
        <p className="username-display">{username}</p>
      </div>
      
      <button onClick={onLeaveRoom} className="leave-button-sidebar">
        Leave Room
      </button>
    </div>
  );

  // Handle search expansion
  const handleSearchExpansion = useCallback((expanded) => {
    setSearchExpanded(expanded);
  }, []);

  return (
    <div className={`room-screen-new ${isSidebarOpen ? 'sidebar-open' : ''} ${searchExpanded ? 'search-expanded' : ''}`}>
      {/* Main content column */}
      <main className="main-content-column">
        <div className={`top-search-container ${searchExpanded ? 'expanded' : ''}`}>
          <VideoSearch
            searchResults={searchResults}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            onAddToQueue={handleAddToQueue}
            onExpansionChange={handleSearchExpansion}
          />
        </div>

        <div className="player-container-new">
          {playbackState.currentVideo ? (
            <PersistentYouTubePlayer
              videoId={playbackState.currentVideo}
              isPlaying={playbackState.isPlaying}
              currentTime={playbackState.currentTime}
              onReady={onPlayerReady}
              onStateChange={handlePlayerStateChange}
            />
          ) : (
            <div className="player-placeholder-new">
              <div className="placeholder-content">
                <div className="placeholder-icon">🎬</div>
                <h3>Welcome to the room, {username}!</h3>
                <p>Search for a video above and add it to the queue to start watching together.</p>
                <div className="quick-actions">
                  <button 
                    className="quick-action-btn"
                    onClick={() => document.querySelector('.search-input')?.focus()}
                  >
                    🔍 Start Searching
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bottom-queue-container">
          <div className="queue-header">
            <h3>
              Queue 
              <span className="queue-count">({videoQueue.length})</span>
            </h3>
            {videoQueue.length > 0 && (
              <div className="queue-controls">
                <button 
                  className="clear-queue-btn"
                  onClick={() => {
                    if (confirm('Clear entire queue?')) {
                      videoQueue.forEach(video => removeFromQueue(video.id));
                    }
                  }}
                  title="Clear queue"
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
      
      {error && (
        <div className="error-message global-error">
          <span>⚠️ {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <aside className={`sidebar-new ${isSidebarOpen ? 'open' : ''}`}>
        <button 
          className="sidebar-toggle-new" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <div className="sidebar-inner-new">
          <RoomInfoPanel 
            roomCode={roomCode}
            username={username}
            onLeaveRoom={onLeaveRoom}
          />

          <nav className="tab-nav-new">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={activeTab === 'chat' ? 'active' : ''}
              aria-pressed={activeTab === 'chat'}
            >
              Chat
              {chatMessages.length > 0 && (
                <span className="tab-badge">{chatMessages.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={activeTab === 'members' ? 'active' : ''}
              aria-pressed={activeTab === 'members'}
            >
              Members
              <span className="tab-badge">{Object.keys(users).length}</span>
            </button>
          </nav>

          <div className="panels-new">
            {activeTab === 'chat' && (
              <ChatWindow
                messages={chatMessages}
                message={message}
                onMessageChange={onMessageChange}
                onSendMessage={onSendMessage}
              />
            )}
            {activeTab === 'members' && <MembersList users={users} />}
          </div>
          
          <div className="voice-chat-bar-new">
            <VoiceChat
              users={users}
              isSpeaking={users[username]?.isSpeaking || false}
              onPushToTalk={onPushToTalk}
            />
          </div>
        </div>
      </aside>
    </div>
  );
};