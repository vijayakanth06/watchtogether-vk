import { useEffect } from 'react';

export const ChatWindow = ({
  messages,
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  chatEndRef
}) => {
  return (
    <div>
      <div style={{ 
        height: '300px', 
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px'
      }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
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