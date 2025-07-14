import { useEffect, useState } from 'react';
import { Tooltip } from './Tooltip'; // You'll need to create this component

export const ChatWindow = ({
  messages,
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  chatEndRef,
  users // Add users prop
}) => {
  const [showMembers, setShowMembers] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Calculate online count whenever users change
  useEffect(() => {
    if (users) {
      const count = Object.keys(users).length;
      setOnlineCount(count);
    }
  }, [users]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Members indicator */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#3ed016ff',
          padding: '5px 10px',
          borderRadius: '15px',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
        onClick={() => setShowMembers(!showMembers)}
        onMouseEnter={() => setShowMembers(true)}
        onMouseLeave={() => setShowMembers(false)}
      >
        <span style={{ fontWeight: 'bold' }}>{onlineCount}</span>
        <span>👥</span>
        
        {/* Members list tooltip */}
        {showMembers && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: 'black',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 101,
            minWidth: '150px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Room Members</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {Object.entries(users).map(([id, user]) => (
                <li key={id} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  {user.name}
                  {user.isSpeaking && <span style={{ marginLeft: '5px', color: 'green' }}>🎤</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div style={{ 
        height: '300px', 
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px',
        marginTop: '10px'
      }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <div>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          rows={3}
          style={{ width: '100%' }}
        />
        <button onClick={onSendMessage}>Send</button>
      </div>
    </div>
  );
};