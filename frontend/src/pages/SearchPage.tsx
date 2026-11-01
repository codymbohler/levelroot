import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchGames } from '../lib/api';
import type { Game } from '../lib/api';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchGames(100, 0, query)
      .then(setGames)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <main className="px-12 py-12">
      <h2 className="text-2xl font-light mb-6">
        Search results for "{query}"
      </h2>

      {loading && <p className="text-ink-mute">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && games.length === 0 && (
        <p className="text-ink-mute text-sm">
          No games match "{query}".
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.slug}`}
            className="rounded-ps-md overflow-hidden bg-surface-card group transition-transform hover:-translate-y-1 block"
          >
            <div className="aspect-[3/4] overflow-hidden bg-charcoal">
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-mute text-xs">
                  no cover
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium leading-tight line-clamp-2">{game.title}</h3>
              <p className="text-xs text-ink-mute mt-1">
                {game.release_date ? new Date(game.release_date).getFullYear() : '—'}
                {game.average_rating && ` · ${game.average_rating.toFixed(1)}★`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default SearchPage;