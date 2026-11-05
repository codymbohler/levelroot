import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { updateProfile, fetchFavorites } from '../lib/api';
import type { Favorite } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setBannerImage(user.banner_image || '');
      
      // Fetch favorites to show banner options
      fetchFavorites(user.id).then(setFavorites).catch(console.error);
    }
  }, [user]);

  if (!user) {
    return (
      <main className="px-8 py-8">
        <p className="text-ink-muted">Please <Link to="/login" className="text-accent-green hover:underline">sign in</Link> to view your settings.</p>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    
    try {
      await updateProfile(token, {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar: avatar.trim() || null,
        bannerImage: bannerImage || null,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => navigate(`/user/${user?.username}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to save settings');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-8 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-medium mb-8">Account Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-surface border border-hairline rounded-lg p-6 space-y-8">
        
        {/* Banner Selection */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2 font-bold">
            Profile Banner
          </label>
          {favorites.length > 0 ? (
            <div>
              <p className="text-sm text-ink-muted mb-3">
                Select a screenshot from one of your favorite games to use as your profile banner.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {favorites.map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => setBannerImage(fav.cover || '')} // Note: We'll use the cover for now
                    className={`relative aspect-[2/3] rounded-md overflow-hidden border-2 transition-all ${
                      bannerImage === fav.cover ? 'border-accent-green ring-2 ring-accent-green/30' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img src={fav.cover || ''} alt={fav.title} className="w-full h-full object-cover" />
                    {bannerImage === fav.cover && (
                      <div className="absolute inset-0 bg-accent-green/20 flex items-center justify-center">
                        <span className="bg-accent-green text-white text-xs font-bold px-2 py-1 rounded">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {bannerImage && (
                <button 
                  type="button" 
                  onClick={() => setBannerImage('')}
                  className="text-xs text-red-400 hover:underline mt-3"
                >
                  Remove custom banner
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              You need to <Link to="/games" className="text-accent-green hover:underline">pick 5 favorite games</Link> to unlock custom banners.
            </p>
          )}
        </div>

        {/* Existing Profile Fields */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2 font-bold">
            Display Name
          </label>
          <input
            type="text"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user.username}
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2 font-bold">
            Bio
          </label>
          <textarea
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little about yourself"
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors resize-y"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2 font-bold">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-accent-green text-sm">Settings saved successfully!</p>}

        <div className="flex justify-end pt-4 border-t border-hairline">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-md bg-accent-green text-white font-semibold hover:bg-accent-green-hover transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </main>
  );
}