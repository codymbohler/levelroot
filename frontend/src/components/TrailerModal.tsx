import { useEffect } from 'react';

type Props = {
  url: string;
  onClose: () => void;
};

export default function TrailerModal({ url, onClose }: Props) {
  // Handle Escape key to close
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // RAWG provides a watch URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
  // We need to extract the video ID to use the embed URL.
  const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-12"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl aspect-video bg-black rounded-md overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors text-xl"
        >
          ✕
        </button>
        
        <iframe
          src={embedUrl}
          title="Game Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}