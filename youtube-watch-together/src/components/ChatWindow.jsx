import { useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';

export const ChatWindow = ({
  messages,
  message,
  onMessageChange,
  onSendMessage,
}) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className={styles.chatWindowWrapper}>
      <div className={styles.chatMessagesContainer}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.chatMessageItem}>
            <strong className={styles.chatMessageUser}>{msg.user}:</strong> 
            <span className={styles.chatMessageText}>{msg.text}</span>
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
          rows={2}
          className={styles.chatTextArea}
        />
        <button onClick={onSendMessage} className={styles.chatSendButton}>Send</button>
      </div>
    </div>
  );
};