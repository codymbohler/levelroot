import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { updateProfile } from '../lib/api';
import type { UserProfile } from '../lib/api';

type Props = {
  currentProfile: UserProfile;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
};

function EditProfileModal({ currentProfile, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [displayName, setDisplayName] = useState(currentProfile.display_name ?? '');
  const [bio, setBio] = useState(currentProfile.bio ?? '');
  const [avatar, setAvatar] = useState(currentProfile.avatar ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile(token, {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar: avatar.trim() || null,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-card rounded-ps-md max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-mute">Profile</p>
              <h2 className="text-2xl font-light mt-1">Edit your profile</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-mute hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Display name
            </label>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={currentProfile.username}
              className="w-full px-4 py-3 rounded-ps-sm bg-charcoal border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
            <p className="text-xs text-ink-mute mt-1 text-right">
              {displayName.length}/50
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Bio
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself"
              className="w-full px-4 py-3 rounded-ps-sm bg-charcoal border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors resize-y"
            />
            <p className="text-xs text-ink-mute mt-1 text-right">{bio.length}/500</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 rounded-ps-sm bg-charcoal border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
            <p className="text-xs text-ink-mute mt-1">
              Paste a link to an image. File upload coming later.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full border border-hairline text-ink-mute text-sm font-bold tracking-wide hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-full bg-ps-blue text-white text-sm font-bold tracking-wide hover:bg-ps-blue-hover transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;