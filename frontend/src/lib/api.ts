const API_BASE = 'http://localhost:4000';

export type Game = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  release_date: string | null;
  average_rating: number | null;
  rating_count: number;
};

export type GameDetail = Game & {
  rawg_id: number;
  description: string | null;
  genres: string[] | null;
  developers: string[] | null;
  publishers: string[] | null;
  screenshots: string[] | null;
  banner_image: string | null;
  trailer_url: string | null;
};

export async function fetchGame(slug: string): Promise<GameDetail> {
  const res = await fetch(`${API_BASE}/api/games/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch game: ${res.status}`);
  const data = await res.json();
  return data.game as GameDetail;
}

export async function fetchGames(
  limit = 20,
  offset = 0,
  query = '',
  sort = 'rating_count',
  filters?: { developer?: string; publisher?: string; genre?: string }
): Promise<Game[]> {
  const url = new URL(`${API_BASE}/api/games`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  if (query.trim()) url.searchParams.set('q', query.trim());
  if (sort) url.searchParams.set('sort', sort);
  
  if (filters?.developer) url.searchParams.set('developer', filters.developer);
  if (filters?.publisher) url.searchParams.set('publisher', filters.publisher);
  if (filters?.genre) url.searchParams.set('genre', filters.genre);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
  const data = await res.json();
  return data.games as Game[];
}

export type LogStatus = 'backlog' | 'playing' | 'played' | 'beat' | 'completed' | 'dropped';

export type CreateLogInput = {
  gameId: string;
  rating?: number;
  isBeat?: boolean;
  review?: string;
  quickTake?: string;
  playedOn?: string;
};

export async function createLog(token: string, input: CreateLogInput) {
  const res = await fetch(`${API_BASE}/api/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to create log');
  return data.log;
}

export type GameLog = {
  id: string;
  status: LogStatus;
  rating: number | null;
  review: string | null;
  quick_take: string | null;
  like_count: number;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
};

export async function fetchGameLogs(gameId: string, limit = 20): Promise<GameLog[]> {
  const res = await fetch(`${API_BASE}/api/logs/game/${gameId}?limit=${limit}`, {
    cache: 'no-store', // <-- Add this
  });
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
  const data = await res.json();
  return data.logs as GameLog[];
}

export type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar: string | null;
  banner_image: string | null;
  created_at: string;
  follower_count: number;
  following_count: number;
};

export async function fetchUser(username: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/${username}`);
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  const data = await res.json();
  return data.user as UserProfile;
}

export type UserLog = {
  id: string;
  is_played: boolean;
  is_beat: boolean;
  rating: number | null;
  review: string | null;
  quick_take: string | null;
  played_on: string | null;
  started_at: string | null;
  beat_at: string | null;
  completed_at: string | null;
  is_replay: boolean;
  contains_spoilers: boolean;
  like_count: number;
  created_at: string;
  game_id: string;
  game_slug: string;
  game_title: string;
  game_cover: string | null;
  game_release_date: string | null;
};

export async function fetchUserLogs(userId: string, limit = 30): Promise<UserLog[]> {
  const res = await fetch(`${API_BASE}/api/logs/user/${userId}?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
  const data = await res.json();
  return data.logs as UserLog[];
}

export type Favorite = {
  position: number;
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  cover_override?: string | null;
  release_date: string | null;
  average_rating: number | null;
  rating_count: number;
};

export async function fetchFavorites(userId: string): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/api/favorites/user/${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch favorites: ${res.status}`);
  const data = await res.json();
  return data.favorites as Favorite[];
}

export async function setFavorites(token: string, gameIds: string[]): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/api/favorites`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to save favorites');
  return data.favorites as Favorite[];
}

export type RecentLog = {
  id: string;
  is_played: boolean;
  is_beat: boolean;
  rating: number | null;
  review: string | null;
  quick_take: string | null;
  played_on: string | null;
  like_count: number;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
  game_id: string;
  game_slug: string;
  game_title: string;
  game_cover: string | null;
  game_release_date: string | null;
};

export async function fetchRecentLogs(
  limit = 30,
  following = false,
  token?: string | null
): Promise<RecentLog[]> {
  const url = new URL(`${API_BASE}/api/logs/recent`);
  url.searchParams.set('limit', String(limit));
  if (following) url.searchParams.set('following', 'true');

  const headers: Record<string, string> = {};
  if (following && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Failed to fetch recent logs: ${res.status}`);
  const data = await res.json();
  return data.logs as RecentLog[];
}

export async function fetchFollowStatus(token: string, userId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/follows/status/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch follow status: ${res.status}`);
  const data = await res.json();
  return data.following as boolean;
}

export async function followUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/follows/${userId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to follow: ${res.status}`);
}

export async function unfollowUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/follows/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to unfollow: ${res.status}`);
}
export async function updateLog(
  token: string,
  logId: string,
  input: Partial<CreateLogInput>
) {
  const res = await fetch(`${API_BASE}/api/logs/${logId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to update log');
  return data.log;
}

export async function deleteLog(token: string, logId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/logs/${logId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'failed to delete log');
  }
}

export type UserSummary = {
  id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
  followed_at: string;
};

export async function fetchFollowers(userId: string): Promise<UserSummary[]> {
  const res = await fetch(`${API_BASE}/api/follows/${userId}/followers`);
  if (!res.ok) throw new Error(`Failed to fetch followers: ${res.status}`);
  const data = await res.json();
  return data.followers as UserSummary[];
}

export async function fetchFollowing(userId: string): Promise<UserSummary[]> {
  const res = await fetch(`${API_BASE}/api/follows/${userId}/following`);
  if (!res.ok) throw new Error(`Failed to fetch following: ${res.status}`);
  const data = await res.json();
  return data.following as UserSummary[];
}

export type UpdateProfileInput = {
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  bannerImage?: string | null;
};

export async function updateProfile(
  token: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to update profile');
  return data.user as UserProfile;
}

export type FeaturedGame = Game & {
  screenshots: string[] | null;
  banner_image: string | null;
};

export async function fetchFeaturedGames(): Promise<FeaturedGame[]> {
  const res = await fetch(`${API_BASE}/api/games/featured`);
  if (!res.ok) throw new Error(`Failed to fetch featured games: ${res.status}`);
  const data = await res.json();
  return data.games as FeaturedGame[];
}

export async function fetchUserStatusLogs(userId: string, status: LogStatus): Promise<UserLog[]> {
  const res = await fetch(`${API_BASE}/api/logs/user/${userId}/status/${status}`);
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
  const data = await res.json();
  return data.logs as UserLog[];
}

export async function updateGameLog(
  token: string, 
  gameId: string, 
  data: { rating?: number | null, isBeat?: boolean | null, isPlayed?: boolean | null }) {
  const res = await fetch(`${API_BASE}/api/logs/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId, ...data }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'failed to update log');
  return result.log;
}

export async function toggleWishlist(token: string, gameId: string) {
  const res = await fetch(`${API_BASE}/api/wishlist/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'failed to toggle wishlist');
  return result.wishlisted;
}

export async function fetchWishlist(userId: string): Promise<Game[]> {
  const res = await fetch(`${API_BASE}/api/wishlist/${userId}`);
  if (!res.ok) throw new Error('failed to fetch wishlist');
  const data = await res.json();
  return data.games;
}

export async function adminUpdateGame(token: string, gameId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/admin/games/${gameId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to update game');
  return result.game;
}