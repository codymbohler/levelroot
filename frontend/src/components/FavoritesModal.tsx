import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useAuth } from '../lib/auth';
import { fetchGames, setFavorites } from '../lib/api';
import type { Game, Favorite } from '../lib/api';

type Props = {
  currentFavorites: Favorite[];
  onClose: () => void;
  onSaved: (favorites: Favorite[]) => void;
};

function FavoritesModal({ currentFavorites, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    fetchGames(500, 0)
      .then((games) => {
        setAllGames(games);
        // Seed selected with current favorites (matched from allGames)
        const currentIds = currentFavorites.map((f) => f.id);
        const seeded = currentIds
          .map((id) => games.find((g) => g.id === id))
          .filter((g): g is Game => Boolean(g));
        setSelected(seeded);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingGames(false));
  }, []);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const selectedIds = useMemo(() => new Set(selected.map((g) => g.id)), [selected]);

  const filteredGames = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allGames.slice(0, 50);
    return allGames.filter((g) => g.title.toLowerCase().includes(q)).slice(0, 50);
  }, [allGames, search]);

  function toggle(game: Game) {
    if (selectedIds.has(game.id)) {
      setSelected(selected.filter((g) => g.id !== game.id));
    } else if (selected.length < 5) {
      setSelected([...selected, game]);
    }
  }

  function removeAt(index: number) {
    setSelected(selected.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const ids = selected.map((g) => g.id);
      const result = await setFavorites(token, ids);
      onSaved(result);
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
        className="bg-surface-card rounded-ps-md max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-hairline flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-mute">Your Roots</p>
              <h2 className="text-2xl font-light mt-1">Pick 5 favorites</h2>
              <p className="text-xs text-ink-mute mt-1">
                {selected.length}/5 selected
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-mute hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Selected slots */}
          <div className="px-6 py-4 border-b border-hairline">
            <div className="grid grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((i) => {
                const game = selected[i];
                return (
                  <div key={i} className="relative">
                    <button
                      type="button"
                      onClick={() => game && removeAt(i)}
                      className="w-full aspect-[3/4] rounded-ps-md overflow-hidden bg-charcoal border border-hairline hover:border-ps-blue transition-colors relative group"
                    >
                      {game?.cover ? (
                        <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-mute text-xs">
                          {game ? game.title.slice(0, 2) : `Slot ${i + 1}`}
                        </div>
                      )}
                      {game && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity">
                          Remove
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-hairline">
            <input
              type="text"
              placeholder="Search games…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-ps-sm bg-charcoal border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
          </div>

          {/* Games list */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {loadingGames ? (
              <p className="text-ink-mute text-sm">Loading games…</p>
            ) : filteredGames.length === 0 ? (
              <p className="text-ink-mute text-sm">No games match "{search}".</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {filteredGames.map((game) => {
                  const isSelected = selectedIds.has(game.id);
                  const isFull = selected.length >= 5 && !isSelected;
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggle(game)}
                      disabled={isFull}
                      className={`relative aspect-[3/4] rounded-ps-md overflow-hidden bg-charcoal border-2 transition-all ${
                        isSelected
                          ? 'border-ps-blue ring-2 ring-ps-blue/40'
                          : 'border-transparent hover:border-hairline'
                      } ${isFull ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {game.cover ? (
                        <img
                          src={game.cover}
                          alt={game.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-mute text-[10px] p-1 text-center">
                          {game.title}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ps-blue text-white text-xs font-bold flex items-center justify-center">
                          {selected.findIndex((g) => g.id === game.id) + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-hairline flex items-center justify-between gap-3">
            {error ? (
              <p className="text-red-400 text-sm flex-1">{error}</p>
            ) : (
              <p className="text-xs text-ink-mute flex-1">
                Click a game to add or remove. Order matters — first is your #1.
              </p>
            )}
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
              {submitting ? 'Saving…' : 'Save favorites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FavoritesModal;