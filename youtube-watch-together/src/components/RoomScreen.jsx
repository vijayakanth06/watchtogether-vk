import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { VideoSearch } from './VideoSearch';
import { VideoQueue } from './VideoQueue';
import { ChatWindow } from './ChatWindow';
import { VoiceChat } from './VoiceChat';

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
  onPlayerStateChange,
  onLeaveRoom
})  => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const chatEndRef = useRef(null);
  

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSendMessage();
      e.preventDefault();
    }
  };

  return (
    <div>
      <div>
        <h2>Room: {roomCode}</h2>
        <button onClick={onLeaveRoom}>Leave Room</button>
      </div>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div>
        <YouTubePlayer
          videoId={playbackState.currentVideo}
          isPlaying={playbackState.isPlaying}
          currentTime={playbackState.currentTime}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      </div>

      <div>
        <div>
          <button onClick={() => setActiveTab('queue')}>Queue</button>
          <button onClick={() => setActiveTab('search')}>Search</button>
          <button onClick={() => setActiveTab('chat')}>Chat</button>
        </div>

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
  onSelectVideo={(videoId) => updatePlaybackState({
    currentVideo: videoId,
    isPlaying: true,
    currentTime: 0
  })}
  onDeleteVideo={(videoId) => {
    setVideoQueue(prev => prev.filter(video => video.id !== videoId));
    
    // Optional: if the deleted video is currently playing, stop it or skip to next
    if (playbackState.currentVideo === videoId) {
      const nextVideo = videoQueue.find(v => v.id !== videoId);
      updatePlaybackState({
        currentVideo: nextVideo?.id || null,
        isPlaying: false,
        currentTime: 0
      });
    }
  }}
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

      <VoiceChat
        users={users}
        isSpeaking={isSpeaking}
        onPushToTalk={onPushToTalk}
      />
    </div>
  );
};