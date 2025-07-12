import { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/validation';

const ChatWindow = ({ messages, onSend, username }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && username.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div style={{ height: '300px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.username}</strong> ({formatTime(msg.timestamp)}): {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;