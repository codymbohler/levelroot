import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGame, fetchGameLogs, updateGameLog, toggleWishlist } from '../lib/api';
import type { GameDetail, GameLog } from '../lib/api';
import { useAuth } from '../lib/auth';
import LogModal from '../components/LogModal';
import ReviewListCard from '../components/ReviewListCard';
import TrailerModal from '../components/TrailerModal';
import GameLogBox from '../components/GameLogBox';
import AdminGameModal from '../components/AdminGameModal';

function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  // Rating states
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Derived state for our log
  const myLog = logs.find(log => log.user_id === user?.id);
  const isPlayed = myLog?.is_played || false;
  const isBeat = myLog?.is_beat || false;

  async function reloadLogs(gameId: string) {
    try {
      const data = await fetchGameLogs(gameId);
      setLogs(data);
      const mine = data.find(l => l.user_id === user?.id);
      setMyRating(mine?.rating || null);
      
      if (user) {
        const wishRes = await fetch(`http://localhost:4000/api/wishlist/${user.id}`);
        const wishData = await wishRes.json();
        setIsWishlisted(wishData.games.some((g: any) => g.id === gameId));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchGame(slug)
      .then((g) => {
        setGame(g);
        reloadLogs(g.id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, user]);

  if (loading) return <main className="px-8 py-12 text-ink-muted">Loading…</main>;
  if (error || !game) return <main className="px-8 py-12"><p className="text-red-400">{error || 'Game not found'}</p></main>;

  const year = game.release_date ? new Date(game.release_date).getFullYear() : '—';
  const bannerImage = game.banner_image || (game.screenshots && game.screenshots.length > 0 ? game.screenshots[0] : null) || game.cover;

  async function handleRatingClick(newRating: number) {
    if (!token || !game) return;
    setRatingBusy(true);
    const targetRating = myRating === newRating ? null : newRating;
    try {
      await updateGameLog(token, game.id, { rating: targetRating, isPlayed: true });
      await reloadLogs(game.id);
    } finally {
      setRatingBusy(false);
    }
  }

  async function handleBeatToggle() {
    if (!token || !game) return;
    setRatingBusy(true);
    try {
      await updateGameLog(token, game.id, { isBeat: !isBeat, isPlayed: true });
      await reloadLogs(game.id);
    } finally {
      setRatingBusy(false);
    }
  }

  async function handlePlayedToggle() {
    if (!token || !game) return;
    if (isPlayed) {
      if (myLog?.review || myLog?.rating) {
        if (!confirm('This will remove your rating and reviews for this game. Are you sure?')) return;
      }
    }
    setRatingBusy(true);
    try {
      await updateGameLog(token, game.id, { isPlayed: !isPlayed });
      await reloadLogs(game.id);
    } finally {
      setRatingBusy(false);
    }
  }

  async function handleWishlistToggle() {
    if (!token || !game) return;
    setRatingBusy(true);
    try {
      await toggleWishlist(token, game.id);
      await reloadLogs(game.id);
    } finally {
      setRatingBusy(false);
    }
  }

  return (
    <main className="pb-24">
      {/* HERO BANNER */}
      <div className="relative w-full h-[55vh] min-h-[450px] -mt-[88px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent/0 to-60%" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-transparent to-canvas/70" />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="relative z-20 px-8 max-w-5xl mx-auto -mt-[110px]">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_240px] gap-10 items-start">
          
          {/* COLUMN 1: The Poster & Trailer */}
          <div className="w-48 shrink-0 md:pt-9">
            <div className="rounded-md overflow-hidden bg-charcoal shadow-2xl border border-hairline aspect-[2/3]">
              {/* Use cover_override if it exists, otherwise fallback to game.cover */}
              {(game.cover_override || game.cover) ? (
                <img src={game.cover_override || game.cover} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-muted">no cover</div>
              )}
            </div>

            {/* Watch Trailer Link */}
            {game.trailer_url && (
              <div className="mt-16			  pt-4 border-t border-hairline text-center">
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="text-sm font-bold text-ink-muted hover:text-white transition-colors"
                >
                  Watch Trailer
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 2: Title, Ratings, Synopsis, Metadata */}
          <div className="flex flex-col pt-8">
            <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-white drop-shadow-lg">{game.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm font-medium text-white/80">
              <span className="text-ink-muted font-medium">{year}</span>
            </div>

            {game.description && (
              <div className="mt-6">
                <p className="text-ink leading-relaxed text-sm whitespace-pre-wrap drop-shadow-sm">
                  {isExpanded || game.description.length <= 600 ? game.description : `${game.description.slice(0, game.description.lastIndexOf(' ', 600))}...`}
                  {(game.description.length > 600) && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-ink font-bold hover:text-white transition-colors ml-1 focus:outline-none">
                      {isExpanded ? 'less' : 'more'}
                    </button>
                  )}
                </p>
              </div>
            )}

            <section className="mt-8 pt-6 border-t border-hairline grid grid-cols-2 gap-6 text-sm">
              {game.developers && game.developers.length > 0 && (
                <div>
                  <h3 className="text-ink-muted mb-1 uppercase tracking-wider text-xs font-bold">Developer</h3>
                  <p className="text-ink font-medium">{game.developers.join(', ')}</p>
                </div>
              )}
              {game.publishers && game.publishers.length > 0 && (
                <div>
                  <h3 className="text-ink-muted mb-1 uppercase tracking-wider text-xs font-bold">Publisher</h3>
                  <p className="text-ink font-medium">{game.publishers.join(', ')}</p>
                </div>
              )}
              {game.genres && game.genres.length > 0 && (
                <div className="col-span-2 mt-2">
                  <h3 className="text-ink-muted mb-2 uppercase tracking-wider text-xs font-bold">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map(g => <span key={g} className="px-2 py-1 bg-surface border border-hairline rounded-md text-xs text-ink-muted">{g}</span>)}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* COLUMN 3: The Log Box */}
          <GameLogBox
            game={game}
            user={user}
            myRating={myRating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            isPlayed={isPlayed}
            isBeat={isBeat}
            isWishlisted={isWishlisted}
            ratingBusy={ratingBusy}
            handleRatingClick={handleRatingClick}
            handlePlayedToggle={handlePlayedToggle}
            handleBeatToggle={handleBeatToggle}
            handleWishlistToggle={handleWishlistToggle}
            setModalOpen={setModalOpen}
          />
          
        </div>

        {/* Reviews Section */}
        <section className="mt-16 pt-8 border-t border-hairline">
          <h2 className="text-2xl font-display font-medium mb-2">
            Reviews {logs.length > 0 && <span className="text-ink-muted text-lg">({logs.length})</span>}
          </h2>
          {logs.length === 0 ? (
            <p className="text-ink-muted text-sm mt-6">No reviews yet. Be the first to log this game.</p>
          ) : (
            <div>
              {logs.map((log) => (
                <ReviewListCard key={log.id} log={log as any} hideGame={true} />
              ))}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <LogModal
          gameId={game.id}
          gameTitle={game.title}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            reloadLogs(game.id);
          }}
        />
      )}

      {trailerOpen && game.trailer_url && (
        <TrailerModal 
          url={game.trailer_url} 
          onClose={() => setTrailerOpen(false)} 
        />
      )}
	  
      {/* Admin Floating Gear Icon */}
      {user?.is_admin && (
        <div className="fixed bottom-0 right-0 group z-40">
          <button
            onClick={() => setAdminModalOpen(true)}
            className="p-8 bg-transparent text-ink-muted hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
            title="Admin Edit"
          >
            <div className="p-3 rounded-full bg-surface border border-hairline shadow-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </button>
        </div>
      )}
	  
      {/* Admin Modal */}
      {adminModalOpen && (
        <AdminGameModal
          game={game}
          onClose={() => setAdminModalOpen(false)}
          onSaved={(updated) => {
            setGame(updated); // Instantly update the page
            setAdminModalOpen(false);
          }}
        />
      )}

    </main>
  );
}

export default GamePage;