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
  const [activeTab, setActiveTab] = useState('queue'); // Default to queue

  // When a video is added, switch to the queue tab
  const handleAddToQueue = (video) => {
    onAddToQueue(video);
    setActiveTab('queue');
  };

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
      const nextVideo = videoQueue[currentIndex] || videoQueue[0];
       updatePlaybackState({
        currentVideo: nextVideo?.id || null,
        isPlaying: !!nextVideo,
        currentTime: 0
      });
    }
  }, [playbackState.currentVideo, removeFromQueue, updatePlaybackState, videoQueue]);

  const MembersList = ({ users }) => (
    <div className="panel-content">
      <ul className="members-list">
        {Object.entries(users).map(([id, user]) => (
          <li key={id}>
            <span>{user.name}</span>
            {user.isSpeaking && (
              <span className="speaking-indicator">🎤</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`room-screen-new ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <header className="room-header-new">
        <div className="header-info">
          <h2>Room: <span>{roomCode}</span></h2>
          <p>User: <span>{username}</span></p>
        </div>
        <button onClick={onLeaveRoom} className="leave-button">Leave Room</button>
      </header>
      
      <main className="main-content-new">
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
              <h3>Welcome to the room!</h3>
              <p>Search for a video and add it to the queue to get started.</p>
            </div>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
      </main>

      <aside className={`sidebar-new ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-toggle-new" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        
        <div className="sidebar-inner-new">
          <nav className="tab-nav-new">
            <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'active' : ''}>Search</button>
            <button onClick={() => setActiveTab('queue')} className={activeTab === 'queue' ? 'active' : ''}>Queue ({videoQueue.length})</button>
            <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'active' : ''}>Chat</button>
            <button onClick={() => setActiveTab('members')} className={activeTab === 'members' ? 'active' : ''}>Members ({Object.keys(users).length})</button>
          </nav>

          <div className="panels-new">
            {activeTab === 'search' && (
              <VideoSearch
                searchResults={searchResults}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                onAddToQueue={handleAddToQueue}
              />
            )}
            {activeTab === 'queue' && (
              <VideoQueue
                videos={videoQueue}
                currentVideo={playbackState.currentVideo}
                onSelectVideo={handleSelectVideo}
                onDeleteVideo={handleDeleteVideo}
              />
            )}
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