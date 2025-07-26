import { useState, useEffect } from 'react';

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
    <div className="home-screen">
      <div className="home-container">
        <h1>YouTube Watch Together</h1>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            required
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleCreateRoom} 
            disabled={!username || isCreating || isJoining}
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
        </div>
        
        <div className="join-divider">
          <span>OR</span>
        </div>

        <div className="form-group join-group">
          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            pattern="[A-Z0-9]{6}"
            maxLength={6}
            required
          />
          <button 
            onClick={handleJoinRoom} 
            disabled={!username || !roomCode || isCreating || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};
