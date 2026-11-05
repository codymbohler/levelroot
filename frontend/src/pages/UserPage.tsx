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
import ReviewListCard from '../components/ReviewListCard';

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

  if (loading) return <main className="px-8 py-12 text-ink-muted">Loading…</main>;
  if (error || !user) return <main className="px-8 py-12"><p className="text-red-400">{error || 'User not found'}</p></main>;

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  const isOwnProfile = me?.id === user.id;

  // Pick the banner: User's custom banner -> First favorite game cover -> null
  const bannerImage = user.banner_image || (favorites.length > 0 ? favorites[0].cover : null);

  return (
    <main className="pb-24">
      {/* HERO BANNER */}
      <div className="relative w-full h-[40vh] min-h-[300px] -mt-[88px]">
        {bannerImage ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerImage})` }} />
            {/* Fades */}
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-transparent to-canvas/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
      </div>

      {/* PROFILE HEADER OVERLAY */}
      <div className="relative z-20 px-8 max-w-5xl mx-auto -mt-32">
        <div className="flex items-end justify-between gap-6">
          
          {/* Avatar and Info */}
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 rounded-full bg-charcoal overflow-hidden shrink-0 border-4 border-canvas shadow-2xl">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-muted text-5xl font-light">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="pb-2">
              <h1 className="text-4xl font-display font-medium tracking-tight text-white drop-shadow-md">
                {user.display_name || user.username}
              </h1>
              <p className="text-ink-muted mt-1 text-sm font-medium">@{user.username}</p>
              
              <div className="flex gap-6 mt-4 text-sm">
                <Link to={`/user/${user.username}/followers`} className="hover:text-accent-green transition-colors">
                  <span className="text-xl font-display font-medium text-white">{user.follower_count}</span>
                  <span className="text-ink-muted ml-1.5">
                    {user.follower_count === 1 ? 'follower' : 'followers'}
                  </span>
                </Link>
                <Link to={`/user/${user.username}/following`} className="hover:text-accent-green transition-colors">
                  <span className="text-xl font-display font-medium text-white">{user.following_count}</span>
                  <span className="text-ink-muted ml-1.5">following</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pb-2">
            {me && me.id !== user.id && (
              <button
                onClick={toggleFollow}
                disabled={followBusy}
                className={`px-7 py-2.5 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'border border-hairline text-ink-muted hover:text-ink bg-black/50 backdrop-blur'
                    : 'bg-accent-green text-white hover:bg-accent-green-hover'
                }`}
              >
                {followBusy ? '…' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            {isOwnProfile && (
              <Link
                to="/settings"
                className="px-7 py-2.5 rounded-full border border-hairline bg-black/50 backdrop-blur text-ink-muted font-bold text-sm tracking-wide hover:text-ink transition-colors inline-block"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-ink-muted mt-6 max-w-2xl leading-relaxed text-sm">{user.bio}</p>
        )}
      </div>

      {/* 5 Favorites band */}
      <div className="px-8 pt-12 pb-8 max-w-5xl mx-auto border-b border-hairline">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-medium">
            Favorites {favorites.length > 0 && <span className="text-ink-muted">({favorites.length}/5)</span>}
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setShowFavModal(true)}
              className="px-5 py-2 rounded-full bg-surface border border-hairline text-white text-sm font-bold tracking-wide hover:bg-surface-hover transition-colors"
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
                <div className="aspect-[2/3] overflow-hidden bg-charcoal">
                  {fav.cover ? (
                    <img
                      src={fav.cover}
                      alt={fav.title}
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
                  <p className="text-xs font-medium leading-tight line-clamp-2">{fav.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="px-8 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-display font-medium mb-6">
          Recent Activity {logs.length > 0 && <span className="text-ink-muted">({logs.length})</span>}
        </h2>

        {logs.length === 0 ? (
          <p className="text-ink-muted text-sm">Nothing logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {logs.slice(0, 10).map((log) => (
              <ReviewListCard key={log.id} log={log as any} />
            ))}
          </div>
        )}
        
        {logs.length > 10 && (
          <div className="mt-8 text-center">
            <Link 
              to={`/user/${user.username}/games`} 
              className="px-6 py-2.5 rounded-full border border-hairline text-ink-muted font-bold text-sm hover:text-white transition-colors"
            >
              View all activity
            </Link>
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