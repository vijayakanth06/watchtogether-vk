export const searchYouTubeVideos = async (query, apiKey) => {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
      channel: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
};