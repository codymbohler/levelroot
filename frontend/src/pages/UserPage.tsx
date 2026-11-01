import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchUser,
  fetchUserLogs,
  fetchFavorites,
  fetchFollowStatus,
  followUser,
  unfollowUser,
  deleteLog,
} from '../lib/api';
import type { UserProfile, UserLog, Favorite } from '../lib/api';
import { useAuth } from '../lib/auth';
import FavoritesModal from '../components/FavoritesModal';
import LogModal from '../components/LogModal';

function UserPage() {
  const { username } = useParams<{ username: string }>();
  const { user: me, token } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFavModal, setShowFavModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [editingLog, setEditingLog] = useState<UserLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetchUser(username)
      .then((u) => {
        setUser(u);
        return Promise.all([
          fetchUserLogs(u.id, 30),
          fetchFavorites(u.id),
          token && me && me.id !== u.id
            ? fetchFollowStatus(token, u.id)
            : Promise.resolve(false),
        ]);
      })
      .then(([l, f, following]) => {
        setLogs(l);
        setFavorites(f);
        setIsFollowing(following);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, token, me]);

  async function toggleFollow() {
    if (!token || !user) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowUser(token, user.id);
        setIsFollowing(false);
        setUser({ ...user, follower_count: user.follower_count - 1 });
      } else {
        await followUser(token, user.id);
        setIsFollowing(true);
        setUser({ ...user, follower_count: user.follower_count + 1 });
      }
    } catch (err) {
      console.error('follow toggle failed:', err);
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleDeleteLog(logId: string) {
    if (!token) return;
    if (!confirm('Delete this log? This cannot be undone.')) return;
    setDeletingLogId(logId);
    try {
      await deleteLog(token, logId);
      setLogs(logs.filter((l) => l.id !== logId));
    } catch (err) {
      console.error('delete log failed:', err);
    } finally {
      setDeletingLogId(null);
    }
  }

  if (loading) {
    return <main className="px-8 py-12 text-ink-muted">Loading…</main>;
  }

  if (error || !user) {
    return (
      <main className="px-8 py-12">
        <Link to="/" className="text-accent-green hover:underline text-sm">← Back</Link>
        <p className="text-red-400 mt-4">{error || 'User not found'}</p>
      </main>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  const isOwnProfile = me?.id === user.id;

  return (
    <main>
      {/* Profile header */}
      <div className="px-8 py-12 border-b border-hairline">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-charcoal overflow-hidden shrink-0 border-2 border-hairline">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-muted text-3xl font-light">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-display font-medium tracking-tight">
              {user.display_name || user.username}
            </h1>
            <p className="text-ink-muted mt-1 text-sm">@{user.username}</p>
            <p className="text-ink-muted mt-2 text-xs">Member since {memberSince}</p>
          </div>

          {me && me.id !== user.id && (
            <button
              onClick={toggleFollow}
              disabled={followBusy}
              className={`px-7 py-3 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50 ${
                isFollowing
                  ? 'border border-hairline text-ink-muted hover:text-ink'
                  : 'bg-accent-green text-white hover:bg-accent-green-hover'
              }`}
            >
              {followBusy ? '…' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          {isOwnProfile && (
            <Link
              to="/settings"
              className="px-7 py-3 rounded-full border border-hairline text-ink-muted font-bold text-sm tracking-wide hover:text-ink transition-colors"
            >
              Edit profile
            </Link>
          )}
        </div>

        {user.bio && (
          <p className="text-ink-muted mt-6 max-w-2xl leading-relaxed">{user.bio}</p>
        )}

        <div className="flex gap-8 mt-6 text-sm">
          <div>
            <span className="text-2xl font-display font-medium">{logs.length}</span>
            <span className="text-ink-muted ml-2">logged</span>
          </div>
          <div>
            <span className="text-2xl font-display font-medium">{favorites.length}</span>
            <span className="text-ink-muted ml-2">favorites</span>
          </div>
          <Link to={`/user/${user.username}/followers`} className="hover:text-accent-green transition-colors">
            <span className="text-2xl font-display font-medium">{user.follower_count}</span>
            <span className="text-ink-muted ml-2">
              {user.follower_count === 1 ? 'follower' : 'followers'}
            </span>
          </Link>
          <Link to={`/user/${user.username}/following`} className="hover:text-accent-green transition-colors">
            <span className="text-2xl font-display font-medium">{user.following_count}</span>
            <span className="text-ink-muted ml-2">following</span>
          </Link>
        </div>
      </div>

      {/* 5 Favorites band */}
      <div className="px-8 py-12 border-b border-hairline">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-medium">
            Favorites {favorites.length > 0 && <span className="text-ink-muted">({favorites.length}/5)</span>}
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setShowFavModal(true)}
              className="px-5 py-2 rounded-full bg-accent-green text-white text-sm font-bold tracking-wide hover:bg-accent-green-hover transition-colors"
            >
              {favorites.length === 0 ? 'Pick favorites' : 'Edit favorites'}
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <p className="text-ink-muted text-sm">No favorites yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                to={`/games/${fav.slug}`}
                className="rounded-md overflow-hidden bg-surface border border-hairline group transition-transform hover:-translate-y-1 block"
              >
                <div className="aspect-[3/4] overflow-hidden bg-charcoal">
                  {fav.cover ? (
                    <img src={fav.cover} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">no cover</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium leading-tight line-clamp-2">{fav.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="px-8 py-12">
        <h2 className="text-2xl font-display font-medium mb-6">
          Activity {logs.length > 0 && <span className="text-ink-muted">({logs.length})</span>}
        </h2>

        {logs.length === 0 ? (
          <p className="text-ink-muted text-sm">Nothing logged yet.</p>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => {
              return (
                <article key={log.id} className="flex gap-6 pb-6 border-b border-hairline last:border-0">
                  <Link to={`/games/${log.game_slug}`} className="w-20 shrink-0 self-start rounded-md overflow-hidden bg-charcoal block aspect-[3/4]">
                    {log.game_cover ? (
                      <img src={log.game_cover} alt={log.game_title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted text-[10px]">no cover</div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link to={`/games/${log.game_slug}`} className="text-lg font-display font-medium hover:text-accent-green transition-colors">
                        {log.game_title}
                      </Link>

                      {/* UPDATED BADGE */}
                      <span
                        className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full ${
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
                        <span className="text-accent-gold text-sm">
                          {'★'.repeat(Math.floor(log.rating))}
                          {log.rating % 1 >= 0.5 && '⯨'}
                          <span className="text-ink-muted ml-2">{log.rating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-ink-muted">
                        {new Date(log.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {log.played_on && ` · played on ${log.played_on}`}
                      </p>

                      {isOwnProfile && (
                        <div className="flex items-center gap-2 text-xs">
                          <button onClick={() => setEditingLog(log)} className="text-ink-muted hover:text-accent-green transition-colors">Edit</button>
                          <span className="text-ink-muted">·</span>
                          <button onClick={() => handleDeleteLog(log.id)} disabled={deletingLogId === log.id} className="text-ink-muted hover:text-red-400 transition-colors disabled:opacity-50">
                            {deletingLogId === log.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>

                    {log.quick_take && <p className="text-ink mt-3 font-medium">{log.quick_take}</p>}
                    {log.review && <p className="text-ink-muted mt-2 leading-relaxed whitespace-pre-wrap">{log.review}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showFavModal && (
        <FavoritesModal
          currentFavorites={favorites}
          onClose={() => setShowFavModal(false)}
          onSaved={(newFavorites) => {
            setFavorites(newFavorites);
            setShowFavModal(false);
          }}
        />
      )}
    </main>
  );
}

export default UserPage;