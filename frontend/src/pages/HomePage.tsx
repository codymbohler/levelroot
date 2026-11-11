import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecentLogs } from '../lib/api';
import type { RecentLog } from '../lib/api';
import { useAuth } from '../lib/auth';
import HeroCarousel from '../components/HeroCarousel';

function HomePage() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'everyone' | 'following'>('everyone');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRecentLogs(30, tab === 'following', token)
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, token]);

  return (
    <main>
      <div className="-mt-[88px]">
        <HeroCarousel />
      </div>
      <div className="px-8 py-8">
        <div className="flex items-center gap-6 mb-6">
          <h2 className="text-2xl font-display font-medium">Activity</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('everyone')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-colors ${
                tab === 'everyone' ? 'bg-accent-green text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Everyone
            </button>
            {user && (
              <button
                onClick={() => setTab('following')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-colors ${
                  tab === 'following' ? 'bg-accent-green text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Following
              </button>
            )}
          </div>
        </div>

        {loading && <p className="text-ink-muted">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && logs.length === 0 && (
          <p className="text-ink-muted text-sm">
            {tab === 'following' ? (
              <>
                No activity from people you follow yet.{' '}
                <Link to="/games" className="text-accent-green hover:underline">Browse games</Link>{' '}
                or find users to follow.
              </>
            ) : (
              <>
                No activity yet. Be the first —{' '}
                <Link to="/games" className="text-accent-green hover:underline">browse games</Link>.
              </>
            )}
          </p>
        )}

        <div className="space-y-6 max-w-3xl">
          {logs.map((log) => {
            return (
              <article key={log.id} className="flex gap-5 pb-6 border-b border-hairline last:border-0">
                <Link to={`/games/${log.game_slug}`} className="w-16 shrink-0 self-start rounded-md overflow-hidden bg-charcoal block aspect-[3/4] hover:scale-105 transition-transform">
                  {log.game_cover ? (
                    <img src={log.game_cover} alt={log.game_title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-[10px]">no cover</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-ink-muted">
                    <Link to={`/user/${log.username}`} className="text-ink font-medium hover:text-accent-green transition-colors">
                      {log.display_name || log.username}
                    </Link>{' '}
                    {log.is_beat ? 'beat' : 'played'}
                  </p>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Link to={`/games/${log.game_slug}`} className="text-lg font-display font-medium hover:text-accent-green transition-colors leading-tight">
                      {log.game_title}
                    </Link>

                    {/* BADGE */}
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                        log.is_beat ? 'text-black' : 'bg-accent-green text-white'
                      }`}
                      style={
                        log.is_beat
                          ? { background: 'linear-gradient(to right, #ffce21, #f5a623, #ee8e00)' }
                          : undefined
                      }
                    >
                      {log.is_beat ? 'Beat' : 'Played'}
                    </span>

                    {log.rating !== null && (
                      <span className="text-accent-gold text-sm tracking-widest">
                        {'★'.repeat(Math.floor(log.rating))}
                        {log.rating % 1 >= 0.5 && '⯨'}
                      </span>
                    )}
                  </div>
                  {/* ... (rest of the date and review text) ... */}

                  <p className="text-xs text-ink-muted mt-1.5">
                    {new Date(log.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    {log.played_on && ` · played on ${log.played_on}`}
                  </p>

                  {log.quick_take && <p className="text-ink mt-2.5 font-medium">{log.quick_take}</p>}
                  {log.review && <p className="text-ink-muted mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{log.review}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default HomePage;