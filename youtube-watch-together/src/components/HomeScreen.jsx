import { useState, useEffect } from 'react';
import styles from '../styles/HomeScreen.module.css';

export const HomeScreen = ({ 
  onCreateRoom, 
  onJoinRoom, 
  roomCode, 
  setRoomCode, 
  username, 
  setUsername,
  error
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('yt_watch_together_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setUsername(session.username || '');
      } catch (e) {
        // Ignore errors
      }
    }
  }, [setUsername]);

  const handleCreateRoom = async () => {
    if (!username.trim()) return;
    setIsCreating(true);
    try {
      await onCreateRoom();
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) return;
    setIsJoining(true);
    try {
      await onJoinRoom();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.homeScreenWrapper}>
      <div className={styles.homeScreenContainer}>
        <h1 className={styles.homeScreenTitle}>YouTube Watch Together</h1>
        {error && <div className={styles.homeScreenError}>{error}</div>}
        
        <div className={styles.homeFormGroup}>
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            required
            className={styles.homeUsernameInput}
          />
        </div>

        <div className={styles.homeButtonGroup}>
          <button 
            onClick={handleCreateRoom} 
            disabled={!username || isCreating || isJoining}
            className={styles.homeCreateButton}
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
        </div>
        
        <div className={styles.homeJoinDivider}>
          <span>OR</span>
        </div>

        <div className={`${styles.homeFormGroup} ${styles.homeJoinGroup}`}>
          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            pattern="[A-Z0-9]{6}"
            maxLength={6}
            required
            className={styles.homeRoomCodeInput}
          />
          <button 
            onClick={handleJoinRoom} 
            disabled={!username || !roomCode || isCreating || isJoining}
            className={styles.homeJoinButton}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};