import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { createLog } from '../lib/api';

type Props = {
  gameId: string;
  gameTitle: string;
  onClose: () => void;
  onSaved: () => void;
};

function LogModal({ gameId, gameTitle, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [isBeat, setIsBeat] = useState(false);
  const [quickTake, setQuickTake] = useState('');
  const [review, setReview] = useState('');
  const [playedOn, setPlayedOn] = useState('');
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
      await createLog(token, {
        gameId,
        rating: rating ?? undefined,
        isBeat,
        quickTake: quickTake.trim() || undefined,
        review: review.trim() || undefined,
        playedOn: playedOn.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to save log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-hairline rounded-md max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-muted">Review Game</p>
              <h2 className="text-2xl font-display font-medium mt-1">{gameTitle}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-muted hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Beat Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-canvas border border-hairline rounded-md">
            <input
              type="checkbox"
              checked={isBeat}
              onChange={(e) => setIsBeat(e.target.checked)}
              className="w-5 h-5 accent-accent-gold"
            />
            <span className="text-sm font-bold text-white">I beat this game</span>
          </label>

          {/* Rating */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
              Rating {rating !== null && `— ${rating.toFixed(1)}`}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating !== null && rating >= star;
                const isHalf = rating !== null && rating >= star - 0.5 && rating < star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setRating(star - 0.5);
                    }}
                    className="text-3xl leading-none transition-colors"
                    style={{
                      color: isFull || isHalf ? '#d4af37' : 'rgba(229,229,229,0.3)',
                    }}
                  >
                    ★
                  </button>
                );
              })}
              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="text-xs text-ink-muted hover:text-white ml-3 self-center"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick take */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
              Quick take
            </label>
            <input
              type="text"
              maxLength={280}
              value={quickTake}
              onChange={(e) => setQuickTake(e.target.value)}
              placeholder="One-line summary"
              className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors"
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
              Review
            </label>
            <textarea
              rows={6}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think?"
              className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors resize-y"
            />
          </div>

          {/* Played on */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
              Played on
            </label>
            <input
              type="text"
              value={playedOn}
              onChange={(e) => setPlayedOn(e.target.value)}
              placeholder="PC, PS5, Switch…"
              className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-ink focus:outline-none focus:border-accent-green transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-hairline text-ink-muted text-sm font-bold hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-md bg-accent-green text-white text-sm font-bold hover:bg-accent-green-hover transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogModal;