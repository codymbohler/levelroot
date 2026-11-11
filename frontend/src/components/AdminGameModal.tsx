import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { adminUpdateGame } from '../lib/api';

type Props = {
  game: any; // Passing the full game object from GamePage
  onClose: () => void;
  onSaved: (updatedGame: any) => void;
};

export default function AdminGameModal({ game, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (game) {
      setFormData({
        title: game.title || '',
        description: game.description || '',
        developers: game.developers?.join(', ') || '',
        publishers: game.publishers?.join(', ') || '',
        genres: game.genres?.join(', ') || '',
        banner_image: game.banner_image || '',
        cover_override: game.cover_override || '',
        trailer_url: game.trailer_url || '', // <-- ADD THIS
      });
    }
  }, [game]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await adminUpdateGame(token, game.id, {
        title: formData.title,
        description: formData.description,
        developers: formData.developers.split(',').map((s: string) => s.trim()).filter(Boolean),
        publishers: formData.publishers.split(',').map((s: string) => s.trim()).filter(Boolean),
        genres: formData.genres.split(',').map((s: string) => s.trim()).filter(Boolean),
        bannerImage: formData.banner_image,
        coverOverride: formData.cover_override,
        trailerUrl: formData.trailer_url, // <-- ADD THIS
      });
      onSaved(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-hairline rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
            <h2 className="text-xl font-display font-medium text-white">Admin: Edit Game</h2>
            <button type="button" onClick={onClose} className="text-ink-muted hover:text-white text-xl">×</button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Synopsis</label>
            <textarea rows={6} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green resize-y" />
          </div>

          {/* Cover & Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Cover URL (Poster)</label>
              <input type="text" value={formData.cover_override} onChange={(e) => setFormData({ ...formData, cover_override: e.target.value })} placeholder="Paste custom box art URL" className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Banner URL (Screenshot)</label>
              <input type="text" value={formData.banner_image} onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })} placeholder="Paste custom banner URL" className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
            </div>
          </div>
		  
		  {/* Trailer URL */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">
              YouTube Trailer URL
            </label>
            <input 
              type="text" 
              value={formData.trailer_url} 
              onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })} 
              placeholder="https://www.youtube.com/watch?v=..." 
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" 
            />
          </div>

          {/* Developers & Publishers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Developers</label>
              <input type="text" value={formData.developers} onChange={(e) => setFormData({ ...formData, developers: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Publishers</label>
              <input type="text" value={formData.publishers} onChange={(e) => setFormData({ ...formData, publishers: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1 font-bold">Genres</label>
            <input type="text" value={formData.genres} onChange={(e) => setFormData({ ...formData, genres: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink text-sm focus:outline-none focus:border-accent-green" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-md border border-hairline text-ink-muted hover:text-white text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-md bg-accent-green text-white hover:bg-accent-green-hover text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}