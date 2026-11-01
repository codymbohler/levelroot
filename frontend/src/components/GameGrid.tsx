import { Link } from 'react-router-dom';

export type GridGame = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  release_date: string | null;
  average_rating?: number | null;
};

export default function GameGrid({ games, emptyMessage }: { games: GridGame[], emptyMessage: string }) {
  if (games.length === 0) {
    return <p className="text-ink-muted text-sm mt-4">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {games.map((game) => (
        <Link
          key={game.id}
          to={`/games/${game.slug}`}
          className="rounded-md overflow-hidden bg-surface border border-hairline group transition-transform hover:-translate-y-1 block"
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
              <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                no cover
              </div>
            )}
          </div>
          <div className="p-2">
            <h3 className="text-sm font-medium leading-tight line-clamp-2">{game.title}</h3>
            <p className="text-xs text-ink-muted mt-1">
              {game.release_date ? new Date(game.release_date).getFullYear() : '—'}
              {game.average_rating && ` · ${game.average_rating.toFixed(1)}★`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}