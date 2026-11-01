import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUser, fetchUserLogs } from '../lib/api';
import GameGrid from '../components/GameGrid';
import type { GridGame } from '../components/GameGrid';

export default function UserGamesPage() {
  const { username } = useParams();
  const [games, setGames] = useState<GridGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchUser(username)
      .then((u) => fetchUserLogs(u.id, 100))
      .then((logs) => {
        // Remove duplicates if a user logged the same game twice
        const uniqueGames = Array.from(new Map(logs.map((l: any) => [l.game_id, l])).values());
        
        const mapped = uniqueGames.map((l: any) => ({
          id: l.game_id,
          slug: l.game_slug,
          title: l.game_title,
          cover: l.game_cover,
          release_date: l.game_release_date,
        }));
        setGames(mapped);
      })
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-display font-medium mb-6">{username}'s Game Activity</h1>
      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <GameGrid games={games} emptyMessage="No game activity yet." />
      )}
    </main>
  );
}