export const VideoQueue = ({ videos, currentVideo, onSelectVideo, onDeleteVideo }) => {
  if (videos.length === 0) {
    return <p>Queue is empty. Add some videos!</p>;
  }

  return (
    <ul style={{ padding: 0, listStyle: 'none' }}>
      {videos.map((video) => (
        <li 
          key={video.id}
          style={{
            cursor: 'pointer',
            fontWeight: video.id === currentVideo ? 'bold' : 'normal',
            opacity: video.id === currentVideo ? 1 : 0.8,
            padding: '8px',
            borderBottom: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div 
            onClick={() => onSelectVideo(video.id)}
            style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
          >
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              width="80" 
              height="60" 
              loading="lazy"
              style={{ marginRight: '10px' }}
            />
            <div>
              <h4 style={{ margin: 0 }}>{video.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8em', color: '#555' }}>
                Added by: {video.addedBy}
              </p>
            </div>
          </div>

          {/* Delete Button */}
          <button 
            onClick={() => onDeleteVideo(video.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c00',
              cursor: 'pointer',
              marginLeft: '10px',
              fontSize: '1.2em'
            }}
            title="Delete video"
          >
            <h2>❌</h2>
          </button>
        </li>
      ))}
    </ul>
  );
};
