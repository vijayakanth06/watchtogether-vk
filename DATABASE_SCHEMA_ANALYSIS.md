# Database Schema Analysis - YouTube Watch Together

## IMPORTANT NOTE: Current Implementation Uses Firebase Realtime Database (NOT MongoDB)

This application currently uses **Firebase Realtime Database**, not MongoDB. Firebase is a NoSQL real-time database provided by Google. However, I'll show you:
1. Current Firebase schema structure
2. How videos are stored & retrieved
3. How to convert to MongoDB if needed

---

## PART 1: CURRENT FIREBASE REALTIME DATABASE SCHEMA

### Database Structure:
```
firebase_database/
└── rooms/
    └── {roomCode}/                          (e.g., "ABC123")
        ├── createdAt: 1234567890
        ├── createdBy: "Hadi"
        │
        ├── queue/                           (VIDEO PLAYLIST)
        │   └── {videoId}/                   (e.g., "dQw4w9WgXcQ")
        │       ├── title: "Never Gonna Give You Up"
        │       ├── url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        │       ├── thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg"
        │       ├── addedBy: "Hadi"
        │       └── addedAt: 1234567890
        │
        ├── state/                           (PLAYBACK STATE)
        │   ├── currentVideo: "dQw4w9WgXcQ"
        │   ├── isPlaying: true
        │   ├── currentTime: 45.5
        │   └── lastUpdated: 1234567890
        │
        ├── chat/                            (MESSAGES)
        │   └── {messageId}/
        │       ├── text: "Hey! Check this out"
        │       ├── user: "Hadi"
        │       └── timestamp: 1234567890
        │
        └── users/                           (ONLINE USERS)
            └── {userId}/
                ├── name: "Hadi"
                ├── isSpeaking: false
                └── joinedAt: 1234567890
```

---

## PART 2: HOW VIDEOS ARE STORED IN FIREBASE

### A. Video Object Structure When Stored:
```javascript
{
  title: "Never Gonna Give You Up",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  addedBy: "Hadi",
  addedAt: 1709520000000,
  id: "dQw4w9WgXcQ"  // Added by the app when retrieved
}
```

### B. Code That Adds Video to Queue (useRoom.js):
```javascript
const addToQueue = useCallback(async (video) => {
  try {
    // Create a reference to the specific video in Firebase
    const videoRef = ref(db, `rooms/${roomCode}/queue/${video.id}`);
    
    // Save the video data
    await set(videoRef, {
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnail,
      addedBy: username,
      addedAt: Date.now()
    });

    // If queue is empty, start playing this video
    if (videoQueue.length === 0 && !playbackState.currentVideo) {
      await updatePlaybackState({
        currentVideo: video.id,
        isPlaying: true,
        currentTime: 0
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to add video:', error);
    throw error;
  }
}, [roomCode, username, videoQueue, playbackState.currentVideo, updatePlaybackState]);
```

---

## PART 3: HOW VIDEOS ARE RETRIEVED FROM FIREBASE

### A. Real-time Listener Setup (useRoom.js):
```javascript
// This listener runs every time the queue changes
queueUnsub = onValue(ref(db, `rooms/${roomCode}/queue`), (snapshot) => {
  // Get raw data from Firebase
  const data = snapshot.val();
  
  // Convert Firebase object to array
  // Firebase returns: { "dQw4w9WgXcQ": {...}, "jNQXAC9IVRw": {...} }
  // We convert to: [{ id: "dQw4w9WgXcQ", ...}, { id: "jNQXAC9IVRw", ...}]
  const queue = data ? Object.entries(data).map(([id, video]) => ({ id, ...video })) : [];
  
  // Update React state
  setVideoQueue(queue);
});
```

### B. How Videos Are Rendered (VideoQueue.jsx):
```jsx
export const VideoQueue = ({ videoQueue }) => {
  return (
    <div className={styles.videoQueueWrapper}>
      <h3>Queue</h3>
      
      <ul className={styles.queueListContainer}>
        {videoQueue.map((video, index) => (
          <li key={`${video.id}-${index}`} className={styles.queueItemWrapper}>
            {/* Display Thumbnail */}
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className={styles.queueItemThumbnail}
            />
            
            {/* Display Video Info */}
            <div className={styles.queueItemDetails}>
              <h4 className={styles.queueItemTitle}>{video.title}</h4>
              <p className={styles.queueItemAuthor}>Added by: {video.addedBy}</p>
              <span className={styles.queueItemDuration}>
                {new Date(video.addedAt).toLocaleTimeString()}
              </span>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={() => removeFromQueue(index)}
              className={styles.deleteQueueItemBtn}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## PART 4: COMPLETE DATA FLOW - ADDING & PLAYING VIDEO

```
USER ACTION                          CODE                                DATABASE
┌─────────────────┐                                                        
│  User searches  │ → YouTube API → Get video metadata
│  for video      │   (youtubeApi.js)
└─────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  searchResults = [                                                      │
│    {                                                                    │
│      id: { videoId: "dQw4w9WgXcQ" },                                   │
│      snippet: {                                                         │
│        title: "Never Gonna Give You Up",                               │
│        channelTitle: "Rick Astley",                                    │
│        thumbnails: {                                                   │
│          default: { url: "https://i.ytimg.com/vi/..." }                │
│        }                                                                │
│      }                                                                  │
│    }                                                                    │
│  ]                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ↓
┌─────────────────┐
│  User clicks    │
│  "Add Video"    │
└─────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────┐
│ onAddToQueue(video) called                      │
│   → addToQueue() in useRoom.js                  │
│   → Extracts video data                         │
│   → Calls: set(videoRef, {...})                │
└─────────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────────────────┐
│ FIREBASE STORES:                                                 │
│ rooms/ABC123/queue/dQw4w9WgXcQ = {                              │
│   title: "Never Gonna Give You Up",                             │
│   url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",          │
│   thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",  │
│   addedBy: "Hadi",                                              │
│   addedAt: 1709520000000                                        │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
        │
        ↓
┌───────────────────────────────────────────┐
│ Firebase onValue() listener triggers      │
│ → Converts Firebase object to array       │
│ → Updates React state: setVideoQueue([])  │
└───────────────────────────────────────────┘
        │
        ↓
┌───────────────────────────────────────────┐
│ VideoQueue component re-renders           │
│ → Maps through videoQueue array           │
│ → Displays each video with thumbnail      │
│ → Shows title, who added it, timestamp    │
└───────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────┐
│ User clicks a video in the queue       │
│ → playNextVideo() called               │
│ → Firebase state updates:              │
│   rooms/ABC123/state = {               │
│     currentVideo: "dQw4w9WgXcQ",       │
│     isPlaying: true,                   │
│     currentTime: 0,                    │
│     lastUpdated: 1709520000000         │
│   }                                    │
└────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────┐
│ PersistentYouTubePlayer receives       │
│ videoId prop                           │
│ → YouTube Player loads video           │
│ → Video plays to all users in room     │
└────────────────────────────────────────┘
```

---

## PART 5: REMOVING VIDEO FROM QUEUE

### Code:
```javascript
const removeFromQueue = useCallback(async (index) => {
  try {
    const video = videoQueue[index];
    
    // Delete from Firebase
    await remove(ref(db, `rooms/${roomCode}/queue/${video.id}`));
    
    // If we removed the currently playing video, play next
    if (video.id === playbackState.currentVideo) {
      playNextVideo();
    }
  } catch (error) {
    console.error('Failed to remove video:', error);
  }
}, [roomCode, videoQueue, playbackState.currentVideo, playNextVideo]);
```

---

## PART 6: CONVERTING TO MONGODB SCHEMA (If Needed)

### MongoDB Collection Structure:
```javascript
// Collections in MongoDB
db.rooms                // All rooms
db.videos               // All videos (optional - for analytics)
db.playback_states      // Current playback states
db.chat_messages        // Chat history
```

### A. Rooms Collection:
```javascript
{
  _id: ObjectId("..."),
  roomCode: "ABC123",
  createdAt: ISODate("2026-02-03T10:00:00Z"),
  createdBy: "Hadi",
  queue: [
    {
      videoId: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
      addedBy: "Hadi",
      addedAt: ISODate("2026-02-03T10:05:00Z"),
      duration: "3:32"
    },
    // More videos...
  ],
  currentState: {
    currentVideoId: "dQw4w9WgXcQ",
    isPlaying: true,
    currentTime: 45.5,
    lastUpdated: ISODate("2026-02-03T10:06:00Z")
  },
  activeUsers: [
    {
      userId: "user123",
      name: "Hadi",
      isSpeaking: false,
      joinedAt: ISODate("2026-02-03T10:00:00Z")
    }
  ],
  isActive: true,
  expiresAt: ISODate("2026-02-04T10:00:00Z")  // Auto-delete after 24h
}
```

### B. ChatMessages Collection:
```javascript
{
  _id: ObjectId("..."),
  roomCode: "ABC123",
  username: "Hadi",
  message: "This video is awesome!",
  timestamp: ISODate("2026-02-03T10:07:00Z"),
  userId: "user123"
}
```

### C. Videos Collection (Optional - for History/Analytics):
```javascript
{
  _id: ObjectId("..."),
  videoId: "dQw4w9WgXcQ",
  title: "Never Gonna Give You Up",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  timesAdded: 5,
  totalWatchTime: 3600000,  // milliseconds
  lastPlayedAt: ISODate("2026-02-03T10:00:00Z")
}
```

---

## PART 7: CODE MODIFICATIONS FOR MONGODB

### Step 1: Backend API Endpoint (Node.js/Express):
```javascript
// POST /api/rooms/:roomCode/queue - Add video
router.post('/api/rooms/:roomCode/queue', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { videoId, title, url, thumbnail, addedBy } = req.body;

    // Update room's queue array
    const result = await db.collection('rooms').updateOne(
      { roomCode },
      {
        $push: {
          queue: {
            videoId,
            title,
            url,
            thumbnail,
            addedBy,
            addedAt: new Date()
          }
        }
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/rooms/:roomCode/queue/:videoId - Remove video
router.delete('/api/rooms/:roomCode/queue/:videoId', async (req, res) => {
  try {
    const { roomCode, videoId } = req.params;

    await db.collection('rooms').updateOne(
      { roomCode },
      { $pull: { queue: { videoId } } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rooms/:roomCode/queue - Get all videos
router.get('/api/rooms/:roomCode/queue', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await db.collection('rooms').findOne({ roomCode });
    res.json({ queue: room?.queue || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 2: Frontend Service (Replaces Firebase):
```javascript
// services/mongoApi.js
export const videoService = {
  // Add video to queue
  async addToQueue(roomCode, video, username) {
    const response = await fetch(`/api/rooms/${roomCode}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnail,
        addedBy: username
      })
    });
    return response.json();
  },

  // Remove video from queue
  async removeFromQueue(roomCode, videoId) {
    const response = await fetch(`/api/rooms/${roomCode}/queue/${videoId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Get all videos in queue
  async getQueue(roomCode) {
    const response = await fetch(`/api/rooms/${roomCode}/queue`);
    const data = await response.json();
    return data.queue || [];
  },

  // Get single video
  async getVideo(roomCode, videoId) {
    const response = await fetch(`/api/rooms/${roomCode}/queue/${videoId}`);
    return response.json();
  }
};
```

### Step 3: Updated Hook (Replaces useRoom.js):
```javascript
// hooks/useRoomMongo.js
export const useRoomMongo = (roomCode, userId, username) => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [error, setError] = useState(null);

  // Polling for queue updates (or use WebSockets for real-time)
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const queue = await videoService.getQueue(roomCode);
        setVideoQueue(queue);
      } catch (err) {
        setError(err.message);
      }
    };

    // Initial fetch
    fetchQueue();

    // Poll every 2 seconds (or use WebSocket for real-time)
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const addToQueue = useCallback(async (video) => {
    try {
      await videoService.addToQueue(roomCode, video, username);
      // Refetch queue
      const queue = await videoService.getQueue(roomCode);
      setVideoQueue(queue);
    } catch (err) {
      setError(err.message);
    }
  }, [roomCode, username]);

  const removeFromQueue = useCallback(async (videoId) => {
    try {
      await videoService.removeFromQueue(roomCode, videoId);
      // Refetch queue
      const queue = await videoService.getQueue(roomCode);
      setVideoQueue(queue);
    } catch (err) {
      setError(err.message);
    }
  }, [roomCode]);

  return {
    videoQueue,
    chatMessages,
    error,
    addToQueue,
    removeFromQueue
  };
};
```

---

## PART 8: SUMMARY OF KEY DIFFERENCES

| Aspect | Firebase | MongoDB |
|--------|----------|---------|
| **Real-time** | Built-in listeners (onValue) | Need WebSocket or polling |
| **Storage** | NoSQL tree structure | NoSQL document structure |
| **Scalability** | Limited by Firebase plan | Highly scalable |
| **Query** | Simple key-based access | Complex queries possible |
| **Cost** | Pay per read/write | Pay for database usage |
| **Backend** | None (client-side rules) | Requires Node.js/Express API |
| **Code Complexity** | Simple | More complex |

---

## PART 9: CURRENT DATA EXTRACTION CODE SUMMARY

### Where Videos Come From (YouTube Search):
```javascript
// src/services/youtubeApi.js
export const searchYouTubeVideos = async (query) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?q=${query}&key=${apiKey}&part=snippet&type=video&maxResults=10`
  );
  const data = await response.json();
  
  return data.items.map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.default.url,
    channelTitle: item.snippet.channelTitle
  }));
};
```

### Where Videos Get Added (In Memory):
```javascript
// React state in App.jsx
const [videoQueue, setVideoQueue] = useState([]);

// When user clicks add
const addToQueue = async (video) => {
  // 1. Add to Firebase
  await addVideoToFirebase(video);
  
  // 2. Firebase listener updates React state
  // onValue listener triggers → setVideoQueue([...])
};
```

### Where Videos Get Displayed (Rendering):
```javascript
// VideoQueue.jsx
{videoQueue.map((video) => (
  <div key={video.id}>
    <img src={video.thumbnail} />
    <h4>{video.title}</h4>
    <p>Added by: {video.addedBy}</p>
  </div>
))}
```

---

## CONCLUSION

**Current Flow:**
- YouTube API → Search Results → User Selects → Firebase Storage → Real-time Listener → React State → Component Rendering

**If Using MongoDB:**
- YouTube API → Search Results → User Selects → API Call → MongoDB Storage → Polling/WebSocket → React State → Component Rendering

The main change would be replacing Firebase's real-time listeners with either polling or WebSockets to achieve real-time updates.

