# 🎥 WatchTogether - YouTube Party App

A real-time collaborative YouTube watch party app built with **React (Vite + JSX)** and **Firebase**. Watch videos in sync, chat with friends, talk over voice, and manage shared queues — all in one place!

---

## 🚀 Features

- ✅ Create & join rooms using unique room codes  
- 🎬 Synchronized YouTube video playback  
- 🔎 Search and queue YouTube videos  
- 💬 Live chat with scroll-to-latest  
- 🎙️ Push-to-talk voice chat  
- 🧹 Auto-cleanup of inactive rooms  
- 🔒 Firebase Realtime Database with security rules

---

## 📸 Preview

![WatchTogether UI Preview](https://via.placeholder.com/800x400?text=UI+Screenshot+Here)

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite + JSX)
- **Backend**: Firebase Realtime Database, Firebase Auth
- **Voice**: WebRTC or similar PTT mechanism
- **YouTube Integration**: YouTube IFrame API & Search API

---

## ⚙️ Installation & Setup

### 1. 🔽 Clone the repository

```bash
git clone https://github.com/your-username/watchtogether.git
cd watchtogether
cd youtube-watch-together
```

### 2. 📦 Install dependencies
```bash
npm install
```

### 3. ⚙️ Firebase setup
- **Go to Firebase Console**
- **Create a new project**
- **Enable Realtime Database and Anonymous Authentication**
- **Update your .env file**

env
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```
🔐 Make sure .env is listed in .gitignore.

### 4. 🧪 Run locally with Vite
```bash
npm run dev
```
Your app will be live at http://localhost:5173

🚀 Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```
🧾 Firebase Rules (Realtime DB)
```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true,
      "$roomCode": {
        ".read": "auth != null",
        ".write": "auth != null",

        "queue": {
          "$videoId": {
            ".validate": "newData.hasChildren(['title','url','thumbnail','addedBy','addedAt']) && newData.child('title').isString() &&newData.child('url').isString() &&newData.child('url').val().matches(/^https:\\/\\/www\\.youtube\\.com\\/watch\\?v=[a-zA-Z0-9_-]{11}$/) &&newData.child('thumbnail').isString() &&newData.child('addedBy').isString() &&newData.child('addedAt').isNumber() &&newData.child('addedAt').val() <= now",
            ".write": "auth != null"
          }
        },

        "chat": {
          "$messageId": {
            ".validate": "newData.hasChildren(['text','user','timestamp']) &&newData.child('text').isString() &&newData.child('text').val().length > 0 &&newData.child('text').val().length < 500 &&newData.child('user').isString() &&newData.child('timestamp').isNumber() &&newData.child('timestamp').val() <= now",
            ".write": "auth != null"
          }
        },

        "state": {
          ".validate": "newData.hasChildren(['currentVideo','isPlaying','currentTime','lastUpdated']) &&(newData.child('currentVideo').isString() || newData.child('currentVideo').val() === null) &&newData.child('isPlaying').isBoolean() &&newData.child('currentTime').isNumber() &&newData.child('currentTime').val() >= 0 &&newData.child('lastUpdated').isNumber() &&newData.child('lastUpdated').val() <= now",
          ".write": "auth != null"
        },

        "users": {
          "$userId": {
            ".validate": "newData.hasChildren(['name','isSpeaking','joinedAt']) &&newData.child('name').isString() &&newData.child('isSpeaking').isBoolean() &&newData.child('joinedAt').isNumber() &&newData.child('joinedAt').val() <= now",
            ".write": "auth != null && auth.uid == $userId"
          }
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```
✨ Contributing
Pull requests are welcome! If you find bugs or have feature suggestions, open an issue or PR.

Let me know if you want:
- Emojis removed for minimalism
- A version tailored for dark mode previews
- A copy with `pnpm` or `yarn` instead of `npm`
