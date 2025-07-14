import { useState ,useEffect} from 'react';

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

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      await onCreateRoom();
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    setIsJoining(true);
    try {
      await onJoinRoom();
    } finally {
      setIsJoining(false);
    }
  };

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

  return (
    <div>
      <h1>YouTube Watch Together</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
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
      <div>
        <button 
          onClick={handleCreateRoom} 
          disabled={!username || isCreating || isJoining}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Room code"
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
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  );
};