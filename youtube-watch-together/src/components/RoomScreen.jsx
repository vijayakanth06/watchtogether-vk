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
  const [activeTab, setActiveTab] = useState('queue');
  const chatEndRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Keep player mounted at all times
  const [keepPlayerMounted] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSendMessage();
      e.preventDefault();
    }
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
    removeFromQueue(videoId);

    if (playbackState.currentVideo === videoId) {
      const nextVideo = videoQueue.find(v => v.id !== videoId);
      updatePlaybackState({
        currentVideo: nextVideo?.id || null,
        isPlaying: !!nextVideo,
        currentTime: 0
      });
    }
  }, [playbackState.currentVideo, removeFromQueue, updatePlaybackState, videoQueue]);

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>Room: {roomCode}</h2>
        <button onClick={onLeaveRoom}>Leave Room</button>
      </div>

      {error && <div className="error-message">{error}</div>}
<div 
        ref={playerContainerRef}
        style={{
          position: 'relative',
          width: '640px',
          height: '360px',
          margin: '0 auto',
          zIndex: 10 // Ensure it stays above other content
        }}
      >
        {keepPlayerMounted && (
          <PersistentYouTubePlayer
             videoId={playbackState.currentVideo}
             isPlaying={playbackState.isPlaying}
             currentTime={playbackState.currentTime}
             onReady={onPlayerReady}
             onStateChange={handlePlayerStateChange}
          />
        )}
      </div>

      <div className="room-content">
        <div className="tab-buttons">
          <button 
            onClick={() => setActiveTab('queue')}
            className={activeTab === 'queue' ? 'active' : ''}
          >
            Queue
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={activeTab === 'search' ? 'active' : ''}
          >
            Search
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={activeTab === 'chat' ? 'active' : ''}
          >
            Chat
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'search' && (
            <VideoSearch
              searchResults={searchResults}
              onSearchChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
              onAddToQueue={onAddToQueue}
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
              onKeyDown={handleKeyDown}
              onSendMessage={onSendMessage}
              chatEndRef={chatEndRef}
            />
          )}
        </div>
      </div>

      <VoiceChat
        users={users}
        isSpeaking={users[username]?.isSpeaking || false}
        onPushToTalk={onPushToTalk}
      />
    </div>
  );
};