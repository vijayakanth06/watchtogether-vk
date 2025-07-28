import { useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';

export const ChatWindow = ({
  messages,
  message,
  onMessageChange,
  onSendMessage,
  currentUser
}) => {
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) onSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.chatWindowWrapper}>
      <div className={styles.chatMessagesContainer}>
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`${styles.chatMessageItem} ${
              msg.user === currentUser 
                ? styles.userMessage 
                : styles.assistantMessage
            }`}
          >
            {msg.user !== currentUser && (
              <div className={styles.chatMessageUser}>
                {msg.user}
              </div>
            )}
            <div className={styles.chatMessageText}>
              {msg.text}
            </div>
            <div className={styles.messageMeta}>
              <span className={styles.messageTimestamp}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.chatInputContainer}>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className={styles.chatTextArea}
        />
        <button 
          onClick={onSendMessage} 
          disabled={!message.trim()}
          className={styles.chatSendButton}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};