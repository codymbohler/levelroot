import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUser, fetchUserStatusLogs } from '../lib/api';
import GameGrid from '../components/GameGrid';
import type { GridGame } from '../components/GameGrid';

export default function WishlistPage() {
  const { username } = useParams();
  const [games, setGames] = useState<GridGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchUser(username)
      .then((u) => fetchUserStatusLogs(u.id, 'backlog'))
      .then((logs) => {
        // Map the logs to the game shape our grid expects
        const mapped = logs.map((l) => ({
          id: l.game_id,
          slug: l.game_slug,
          title: l.game_title,
          cover: l.game_cover,
          release_date: null, // We don't have this in the logs API, but it's fine
        }));
        setGames(mapped);
      })
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-display font-medium mb-6">{username}'s Wishlist</h1>
      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <GameGrid games={games} emptyMessage="This wishlist is empty." />
      )}
    </main>
  );
}