import { db, ref, onValue, remove } from './firebase';

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ROOM_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const startRoomCleanupService = () => {
  const checkAndCleanRooms = () => {
    const roomsRef = ref(db, 'rooms');
    onValue(roomsRef, (snapshot) => {
      const rooms = snapshot.val() || {};
      const now = Date.now();
      
      Object.entries(rooms).forEach(([code, room]) => {
        if (!room.users || Object.keys(room.users).length === 0) {
          const roomAge = now - (room.createdAt || now);
          if (roomAge > ROOM_TIMEOUT) {
            remove(ref(db, `rooms/${code}`));
          }
        }
      });
    }, { onlyOnce: true });
  };

  // Initial check
  checkAndCleanRooms();
  
  // Periodic checks
  return setInterval(checkAndCleanRooms, CLEANUP_INTERVAL);
};

export const stopRoomCleanupService = (intervalId) => {
  clearInterval(intervalId);
};