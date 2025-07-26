export const VoiceChat = ({ users, isSpeaking, onPushToTalk }) => {
  // Use Object.entries to get the user ID for the key prop
  const speakingUsers = Object.entries(users).filter(([id, user]) => user.isSpeaking);

  return (
    // The component is rendered inside .voice-chat-bar-new, so we can use a fragment
    <>
      <div className="voice-chat-header">
        <h4>Voice Chat</h4>
        <div className={`voice-status ${speakingUsers.length > 0 ? 'active' : ''}`}>
          <span className="indicator-dot"></span>
          <span>{speakingUsers.length > 0 ? `${speakingUsers.length} speaking` : 'Silent'}</span>
        </div>
      </div>
      
      {speakingUsers.length > 0 && (
        <div className="speaking-now">
          {speakingUsers.map(([id, user]) => (
            <div key={id} className="speaker-tag">
              {user.name}
            </div>
          ))}
        </div>
      )}

      <div className="voice-chat-controls">
        <button
          onMouseDown={() => onPushToTalk(true)}
          onMouseUp={() => onPushToTalk(false)}
          onTouchStart={() => onPushToTalk(true)}
          onTouchEnd={() => onPushToTalk(false)}
          className={`push-to-talk-btn ${isSpeaking ? 'speaking' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <span>{isSpeaking ? 'Speaking...' : 'Push to Talk'}</span>
        </button>
      </div>
    </>
  );
};