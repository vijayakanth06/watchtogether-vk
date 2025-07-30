import { useEffect, useRef } from 'react';
import styles from '../styles/ChatWindow.module.css';

export const ChatWindow = ({
  messages,
  message,
  onMessageChange,
  onSendMessage,
  currentUser
}) => {
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  console.log('ChatWindow props:', { messages, currentUser });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    const textarea = e.target;
    onMessageChange(e.target.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight (content height)
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        onSendMessage();
        // Reset textarea height after sending
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  // Format timestamp with enhanced formatting
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Enhanced message grouping with better time logic
  const groupMessages = (messages) => {
    console.log('Grouping messages, currentUser:', currentUser);
    console.log('Messages:', messages);
    
    const grouped = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const prevMsg = messages[index - 1];
      
      // Start new group if different user or time gap > 5 minutes
      const timeDiff = prevMsg ? msg.timestamp - prevMsg.timestamp : 0;
      const shouldStartNewGroup = !prevMsg || 
        prevMsg.user !== msg.user || 
        timeDiff > 300000; // 5 minutes

      const isCurrentUser = msg.user === currentUser;
      console.log(`Message from ${msg.user}, current user: ${currentUser}, isCurrentUser: ${isCurrentUser}`);

      if (shouldStartNewGroup) {
        currentGroup = {
          user: msg.user,
          messages: [msg],
          timestamp: msg.timestamp,
          isCurrentUser: isCurrentUser
        };
        grouped.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
      }
    });

    console.log('Grouped messages:', grouped);
    return grouped;
  };

  const messageGroups = groupMessages(messages);

  return (
    <div className={styles.chatWindowWrapper}>
      <div className={styles.chatMessagesContainer}>
        {messageGroups.length === 0 ? (
          <div className={styles.chatEmptyState}>
            <div className={styles.emptyStateIcon}>💬</div>
            <p className={styles.emptyStateText}>No messages yet</p>
            <p className={styles.emptyStateSubtext}>Start the conversation!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div 
              key={`group-${groupIndex}`}
              className={`${styles.messageGroup} ${
                group.isCurrentUser ? styles.messageGroupRight : styles.messageGroupLeft
              }`}
            >
              {/* User avatar and name (only for other users on left side) */}
              {!group.isCurrentUser && (
                <div className={styles.messageAvatar}>
                  <div 
                    className={styles.avatarCircle}
                    title={group.user}
                  >
                    {group.user.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              <div className={styles.messageContent}>
                {/* Username (only for other users and at start of group) */}
                {!group.isCurrentUser && (
                  <div className={styles.messageUsername}>
                    {group.user}
                  </div>
                )}
                
                {/* Message bubbles */}
                <div className={styles.messageBubbles}>
                  {group.messages.map((msg, msgIndex) => (
                    <div
                      key={msg.id}
                      className={`${styles.messageBubble} ${
                        group.isCurrentUser ? styles.messageBubbleOwn : styles.messageBubbleOther
                      }`}
                      title={formatTime(msg.timestamp)}
                    >
                      <div className={styles.messageText}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Timestamp */}
                <div className={`${styles.messageTimestamp} ${
                  group.isCurrentUser ? styles.timestampRight : styles.timestampLeft
                }`}>
                  {formatTime(group.messages[group.messages.length - 1].timestamp)}
                </div>
              </div>
              
              {/* Spacer for current user messages (on right side) */}
              {group.isCurrentUser && <div className={styles.messageAvatarSpacer} />}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.chatInputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={styles.chatTextArea}
            rows={1}
            aria-label="Type your message"
          />
          <button 
            onClick={onSendMessage} 
            disabled={!message.trim()}
            className={styles.chatSendButton}
            aria-label="Send message"
            title="Send message (Enter)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};