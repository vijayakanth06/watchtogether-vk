import { db, ref, get, remove } from './firebase';
import { getAuth, signInAnonymously } from 'firebase/auth';

const CLEANUP_INTERVAL = 1 * 60 * 60 * 1000; // Check every hour
const ROOM_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const startRoomCleanupService = () => {
  const checkAndCleanRooms = async () => {
    const auth = getAuth();
    try {
      // Sign in anonymously to get auth permissions
      await signInAnonymously(auth);
      
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      const rooms = snapshot.val() || {};
      const now = Date.now();
      
      const cleanupPromises = Object.entries(rooms).map(async ([roomId, roomData]) => {
        try {
          // Check if room has users
          const usersRef = ref(db, `rooms/${roomId}/users`);
          const usersSnapshot = await get(usersRef);
          const hasUsers = usersSnapshot.exists() && Object.keys(usersSnapshot.val()).length > 0;
          
          if (!hasUsers) {
            // Check room age
            const roomAge = now - (roomData.createdAt || now);
            if (roomAge > ROOM_TIMEOUT) {
              await remove(ref(db, `rooms/${roomId}`));
            }
          }
        } catch (error) {
          console.error(`Error processing room ${roomId}:`, error);
        }
      });
      
      await Promise.all(cleanupPromises);
    } catch (error) {
      console.error('Room cleanup authentication error:', error);
    }
  };

  // Initial check
  checkAndCleanRooms();
  
  // Set up periodic checks
  const intervalId = setInterval(checkAndCleanRooms, CLEANUP_INTERVAL);
  
  return intervalId;
};

export const stopRoomCleanupService = (intervalId) => {
  clearInterval(intervalId);
};