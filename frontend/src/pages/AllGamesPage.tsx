import { useEffect, useState } from 'react';
import { fetchGames } from '../lib/api';
import type { Game } from '../lib/api';
import GameGrid from '../components/GameGrid';

function AllGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sort, setSort] = useState('rating_count');
  const [page, setPage] = useState(0); // 0 = Page 1
  
  const limit = 36;
  const offset = page * limit;

  // Reset to page 0 if the sort changes
  useEffect(() => {
    setPage(0);
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    fetchGames(limit, offset, '', sort)
      .then(setGames)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sort, offset]);

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-medium">All games</h2>
        
        <div className="flex items-center gap-3">
          <label className="text-sm text-ink-muted">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface border border-hairline text-ink text-sm rounded-md px-3 py-2 focus:outline-none focus:border-ps-blue transition-colors cursor-pointer appearance-none"
          >
            <option value="rating_count">Most Popular</option>
            <option value="average_rating">Highest Rated</option>
            <option value="release_date">Newest Release</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-ink-muted">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      
      {!loading && !error && (
        <GameGrid games={games} emptyMessage="No games in the catalog yet." />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 mt-12 pb-8">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="px-5 py-2 rounded-md border border-hairline bg-surface text-ink font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span className="text-ink-muted text-sm font-medium">
          Page {page + 1}
        </span>
        
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={games.length < limit || loading}
          className="px-5 py-2 rounded-md border border-hairline bg-surface text-ink font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </main>
  );
}

export default AllGamesPage;