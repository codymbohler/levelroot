import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { updateProfile } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) {
    return (
      <main className="px-8 py-8">
        <p className="text-ink-muted">Please <Link to="/login" className="text-ps-blue hover:underline">sign in</Link> to view your settings.</p>
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
      });
      await refreshUser();
      setSuccess(true);
      
      // Optional: Redirect to profile after a short delay
      setTimeout(() => navigate(`/user/${user?.username}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to save settings');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-8 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-display font-medium mb-8">Account Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-surface border border-hairline rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
            Email Address
          </label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink-muted cursor-not-allowed"
          />
          <p className="text-xs text-ink-muted mt-2">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
            Display Name
          </label>
          <input
            type="text"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user.username}
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
          />
          <p className="text-xs text-ink-muted mt-2 text-right">{displayName.length}/50</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little about yourself"
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors resize-y"
          />
          <p className="text-xs text-ink-muted mt-2 text-right">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
          />
          <p className="text-xs text-ink-muted mt-2">Paste a link to an image. File upload coming soon.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Settings saved successfully!</p>}

        <div className="flex justify-end pt-4 border-t border-hairline">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-md bg-ps-blue text-white font-semibold hover:bg-ps-blue-hover transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </main>
  );
}