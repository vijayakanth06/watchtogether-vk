export const VoiceChat = ({ users, isSpeaking, onPushToTalk }) => {
  const speakingUsers = Object.entries(users)
    .filter(([_, user]) => user.isSpeaking)
    .map(([id, user]) => user.name);

  return (
    <div>
      <h3>Voice Chat</h3>
      {speakingUsers.length > 0 && (
        <p>Currently speaking: {speakingUsers.join(', ')}</p>
      )}
      <button
        onMouseDown={() => onPushToTalk(true)}
        onMouseUp={() => onPushToTalk(false)}
        onTouchStart={() => onPushToTalk(true)}
        onTouchEnd={() => onPushToTalk(false)}
        style={{ 
          backgroundColor: isSpeaking ? 'red' : '#ddd',
          padding: '10px 20px',
          borderRadius: '5px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {isSpeaking ? 'Speaking...' : 'Push to Talk'}
      </button>
    </div>
  );
};