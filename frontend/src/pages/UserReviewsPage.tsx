import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUser, fetchUserLogs } from '../lib/api';
import type { UserLog } from '../lib/api';
import ReviewListCard from '../components/ReviewListCard';

export default function UserReviewsPage() {
  const { username } = useParams();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchUser(username)
      .then((u) => fetchUserLogs(u.id, 50))
      .then((data) => {
        // ONLY KEEP LOGS WITH A WRITTEN REVIEW
        const reviews = data.filter((log) => log.review && log.review.trim() !== '');
        setLogs(reviews);
      })
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <main className="px-8 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-medium mb-2">Reviews by {username}</h1>
      <p className="text-ink-muted text-sm mb-8">
        {logs.length} written {logs.length === 1 ? 'review' : 'reviews'}
      </p>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-ink-muted">
          {username} hasn't written any reviews yet. <Link to="/games" className="text-ps-blue hover:underline">Browse games</Link> to log one.
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <ReviewListCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}