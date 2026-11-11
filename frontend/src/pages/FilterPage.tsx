import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGames } from '../lib/api';
import type { Game } from '../lib/api';
import GameGrid from '../components/GameGrid';

export default function FilterPage({ type }: { type: 'developer' | 'publisher' | 'genre' }) {
  const { value } = useParams<{ value: string }>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!value) return;
    setLoading(true);
    
    const filters = { [type]: value };
    fetchGames(100, 0, '', 'rating_count', filters)
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [value, type]);

  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <main className="px-8 py-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-accent-green text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
        <h1 className="text-4xl font-display font-medium text-white">{value}</h1>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading games…</p>
      ) : games.length === 0 ? (
        <p className="text-ink-muted">No games found for this {type}.</p>
      ) : (
        <GameGrid games={games} emptyMessage={`No games found for this ${type}.`} />
      )}
    </main>
  );
}