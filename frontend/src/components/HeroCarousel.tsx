import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFeaturedGames } from '../lib/api';
import type { FeaturedGame } from '../lib/api';

export default function HeroCarousel() {
  const [games, setGames] = useState<FeaturedGame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedGames().then(setGames).catch(console.error);
  }, []);

  // Rotate every 6 seconds
  useEffect(() => {
    if (games.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [games]);

  if (games.length === 0) return null;

  const game = games[currentIndex];

  // Pick the best image: Banner override -> First screenshot -> Cover
  const bannerImage = game.banner_image 
    || (game.screenshots && game.screenshots.length > 0 ? game.screenshots[0] : null) 
    || game.cover;

  return (
    <div className="relative w-full h-[320px] overflow-hidden bg-canvas">
      
      {/* Sharp Backdrop Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
        style={{ backgroundImage: `url(${bannerImage})` }}
      />
      
      {/* Fades */}
      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-transparent to-canvas/70" />

      {/* Content */}
      <div className="relative h-full flex items-end p-8 pb-4 gap-6 max-w-4xl">
        {/* Poster */}
        <Link 
          to={`/games/${game.slug}`} 
          className="w-28 shrink-0 rounded-md overflow-hidden shadow-2xl block hover:scale-105 transition-transform duration-300 aspect-[3/4]"
        >
          {game.cover ? (
            <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">no cover</div>
          )}
        </Link>

        {/* Text */}
        <div className="pb-0">
          <p className="text-accent-green text-xs font-bold tracking-wider uppercase mb-2">
            Featured Game
          </p>
          <Link to={`/games/${game.slug}`} className="hover:underline decoration-2 underline-offset-4">
            <h1 className="text-4xl font-display font-medium text-white shadow-sm">
              {game.title}
            </h1>
          </Link>
          <p className="text-ink-muted mt-2 text-sm flex items-center gap-3">
            <span>{game.release_date ? new Date(game.release_date).getFullYear() : '—'}</span>
            <span className="w-1 h-1 rounded-full bg-ink-muted/50" />
            <span className="text-accent-gold font-medium">{game.average_rating?.toFixed(1)} ★</span>
            <span className="w-1 h-1 rounded-full bg-ink-muted/50" />
            <span>{game.rating_count.toLocaleString()} ratings</span>
          </p>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 right-8 flex gap-2">
        {games.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? 'bg-accent-green w-6' : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}