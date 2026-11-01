import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUser, fetchFollowers, fetchFollowing } from '../lib/api';
import type { UserProfile, UserSummary } from '../lib/api';

type Mode = 'followers' | 'following';

function FollowersPage({ mode }: { mode: Mode }) {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [list, setList] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    fetchUser(username)
      .then((u) => {
        setUser(u);
        return mode === 'followers' ? fetchFollowers(u.id) : fetchFollowing(u.id);
      })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, mode]);

  if (loading) {
    return <main className="px-12 py-12 text-on-dark-mute">Loading…</main>;
  }

  if (error || !user) {
    return (
      <main className="px-12 py-12">
        <p className="text-red-400">{error || 'User not found'}</p>
      </main>
    );
  }

  const headingText = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <main className="px-12 py-12">
      <Link to={`/user/${user.username}`} className="text-ps-blue hover:underline text-sm">
        ← {user.display_name || user.username}
      </Link>

      <div className="flex items-center gap-6 mt-6 mb-8">
        <h1 className="text-3xl font-light">{headingText}</h1>
        <div className="flex gap-2">
          <Link
            to={`/user/${user.username}/followers`}
            className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-colors ${
              mode === 'followers'
                ? 'bg-ps-blue text-white'
                : 'text-on-dark-mute hover:text-white'
            }`}
          >
            Followers
          </Link>
          <Link
            to={`/user/${user.username}/following`}
            className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-colors ${
              mode === 'following'
                ? 'bg-ps-blue text-white'
                : 'text-on-dark-mute hover:text-white'
            }`}
          >
            Following
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-on-dark-mute text-sm">
          {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {list.map((u) => (
            <Link
              key={u.id}
              to={`/user/${u.username}`}
              className="flex items-center gap-4 p-4 rounded-ps-md bg-surface-dark-card hover:bg-charcoal transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-charcoal overflow-hidden shrink-0">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-dark-mute font-bold">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{u.display_name || u.username}</p>
                <p className="text-xs text-on-dark-mute truncate">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default FollowersPage;