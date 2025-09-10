import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import PropTypes from 'prop-types';

// Utility functions for YouTube
const isYouTubeUrl = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
};

const getYouTubeVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
};

const VideoPlayer = forwardRef(({
  url,
  title,
  description,
  thumbnail,
  duration,
  onPlay,
  onPause,
  onEnded
}, ref) => {
  const videoRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

  useEffect(() => {
    const isYT = isYouTubeUrl(url);
    setIsYouTubeVideo(isYT);
    if (isYT) {
      const videoId = getYouTubeVideoId(url);
      setYoutubeVideoId(videoId);

      // Load YouTube API if not already loaded
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
          initializeYouTubePlayer(videoId);
        };
      } else if (videoId) {
        initializeYouTubePlayer(videoId);
      }
    }
  }, [url]);

  const initializeYouTubePlayer = (videoId) => {
    if ((window as any).YT && (window as any).YT.Player && youtubePlayerRef.current) {
      const player = new (window as any).YT.Player(youtubePlayerRef.current, {
        videoId: videoId,
        events: {
          onReady: (event) => {
            setYoutubePlayer(event.target);
          },
          onStateChange: (event) => {
            if (event.data === (window as any).YT.PlayerState.PLAYING && onPlay) {
              onPlay();
            } else if (event.data === (window as any).YT.PlayerState.PAUSED && onPause) {
              onPause();
            } else if (event.data === (window as any).YT.PlayerState.ENDED && onEnded) {
              onEnded();
            }
          }
        }
      });
    }
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      if (isYouTubeVideo && youtubePlayer) {
        youtubePlayer.playVideo();
      } else if (videoRef.current) {
        videoRef.current.play();
      }
    }
  }));
  // Add structured data for SEO
  useEffect(() => {
    if (typeof window !== 'undefined' && url) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": title,
        "description": description || title,
        "thumbnailUrl": thumbnail || "",
        "uploadDate": new Date().toISOString(),
        "duration": duration ? `PT${duration.replace(' min', 'M')}` : "",
        "contentUrl": url,
        "embedUrl": url,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/WatchAction",
          "userInteractionCount": 0
        }
      };

      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]#video-structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'video-structured-data';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      // Add meta tags for video SEO
      const metaTags = isYouTubeVideo && youtubeVideoId ? [
        { property: 'og:video', content: getYouTubeEmbedUrl(youtubeVideoId) },
        { property: 'og:video:secure_url', content: getYouTubeEmbedUrl(youtubeVideoId) },
        { property: 'og:video:type', content: 'text/html' },
        { property: 'og:video:width', content: '1280' },
        { property: 'og:video:height', content: '720' },
        { name: 'twitter:card', content: 'player' },
        { name: 'twitter:player', content: getYouTubeEmbedUrl(youtubeVideoId) },
        { name: 'twitter:player:width', content: '1280' },
        { name: 'twitter:player:height', content: '720' }
      ] : [
        { property: 'og:video', content: url },
        { property: 'og:video:secure_url', content: url },
        { property: 'og:video:type', content: 'video/mp4' },
        { property: 'og:video:width', content: '1280' },
        { property: 'og:video:height', content: '720' },
        { name: 'twitter:card', content: 'player' },
        { name: 'twitter:player', content: url },
        { name: 'twitter:player:width', content: '1280' },
        { name: 'twitter:player:height', content: '720' }
      ];

      metaTags.forEach(tag => {
        const meta = document.createElement('meta');
        Object.keys(tag).forEach(key => {
          meta.setAttribute(key, tag[key]);
        });
        document.head.appendChild(meta);
      });

      return () => {
        // Cleanup on unmount
        const scriptToRemove = document.querySelector('script[type="application/ld+json"]#video-structured-data');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [url, title, description, thumbnail, duration]);

  const handleVideoPlay = () => {
    if (onPlay) onPlay();
  };

  const handleVideoPause = () => {
    if (onPause) onPause();
  };

  const handleVideoEnded = () => {
    if (onEnded) onEnded();
  };

  return (
    <div className="video-player-container bg-black rounded-lg overflow-hidden shadow-lg">
      {/* Video Player - HTML5 or YouTube */}
      <div className="relative aspect-video bg-gray-900">
        {isYouTubeVideo && youtubeVideoId ? (
          /* YouTube Embed */
          <iframe
            ref={youtubePlayerRef}
            src={getYouTubeEmbedUrl(youtubeVideoId)}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : (
          /* HTML5 Video Player */
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls
              poster={thumbnail}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              preload="metadata"
            >
              <source src={url} type="video/mp4" />
              <source src={url} type="video/webm" />
              <source src={url} type="video/ogg" />
              Your browser does not support the video tag.
            </video>

            {/* Custom Play Button Overlay (for styling) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/30 text-white rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity">
                <FaPlay size={24} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
        )}
        {duration && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Duration: {duration}</p>
        )}
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

VideoPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  thumbnail: PropTypes.string,
  duration: PropTypes.string,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onEnded: PropTypes.func
};

export default VideoPlayer;