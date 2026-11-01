import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchGames } from '../lib/api';
import type { Game } from '../lib/api';
import { Link } from 'react-router-dom';
import AdminGameModal from '../components/AdminGameModal';

export default function AdminPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // We only need to know which game is being edited. 
  // The Modal fetches its own data and handles the save!
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames(100, 0, search, 'title')
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  if (!user || !user.is_admin) {
    return (
      <main className="px-8 py-12 text-center">
        <h1 className="text-2xl font-display text-red-400">Access Denied</h1>
        <p className="text-ink-muted mt-2">You do not have admin permissions.</p>
        <Link to="/" className="text-accent-green hover:underline mt-4 inline-block">Return Home</Link>
      </main>
    );
  }

  return (
    <main className="px-8 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-medium">Admin: Manage Games</h1>
        <input
          type="text"
          placeholder="Search games to edit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-surface border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green w-64"
        />
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading games…</p>
      ) : (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas border-b border-hairline text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Cover</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Release Year</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <img src={game.cover || ''} alt="" className="w-10 h-14 object-cover rounded-sm" />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{game.title}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {game.release_date ? new Date(game.release_date).getFullYear() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingGame(game)}
                      className="text-accent-green hover:text-white transition-colors font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Render the reusable modal */}
      {editingGame && (
        <AdminGameModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSaved={(updated) => {
            // Update the list with the new title if it changed
            setGames(games.map(g => g.id === updated.id ? { ...g, title: updated.title, cover: updated.cover_override || g.cover } : g));
            setEditingGame(null);
          }}
        />
      )}
    </main>
  );
}