export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const validateRoomCode = (code) => {
  return /^[A-Z0-9]{6}$/.test(code);
};

export const validateUsername = (username) => {
  return username && username.trim().length > 0 && username.trim().length <= 20;
};

export const validateMessage = (text) => {
  return text && text.trim().length > 0 && text.trim().length <= 200;
};

export const validateVideoData = (video) => {
  return video && 
         video.videoId && 
         /^[a-zA-Z0-9_-]{11}$/.test(video.videoId) &&
         video.title && 
         video.title.length <= 100 &&
         video.thumbnail && 
         video.addedBy;
};