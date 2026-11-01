import type { GameDetail } from '../lib/api';

type Props = {
  game: GameDetail;
  user: any; // Ideally we use the User type from auth, but any is fine here
  myRating: number | null;
  hoverRating: number | null;
  setHoverRating: (rating: number | null) => void;
  isPlayed: boolean;
  isBeat: boolean;
  isWishlisted: boolean;
  ratingBusy: boolean;
  handleRatingClick: (rating: number) => void;
  handlePlayedToggle: () => void;
  handleBeatToggle: () => void;
  handleWishlistToggle: () => void;
  setModalOpen: (open: boolean) => void;
};

export default function GameLogBox({
  game,
  user,
  myRating,
  hoverRating,
  setHoverRating,
  isPlayed,
  isBeat,
  isWishlisted,
  ratingBusy,
  handleRatingClick,
  handlePlayedToggle,
  handleBeatToggle,
  handleWishlistToggle,
  setModalOpen,
}: Props) {
  return (
    <div className="pt-32">
      <div className="w-full aspect-[2/3] bg-surface border border-hairline rounded-md p-6 shadow-xl flex flex-col justify-between">
        <div>
          {/* Community Rating & Stars */}
          <div className="flex flex-col items-center justify-center pb-4 border-b border-hairline mb-4">
            <div className="text-accent-gold text-2xl font-semibold mb-2">
              {game.average_rating?.toFixed(1)} ★
            </div>

            {/* Star Rating Wrapper */}
            <div className="relative w-full flex items-center justify-center mb-2 h-10 group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8">
                {myRating !== null && (
                  <button
                    onClick={() => handleRatingClick(0)}
                    className="text-ink-muted hover:text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex gap-1" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeRating = hoverRating !== null ? hoverRating : myRating;
                  const isFilled = activeRating !== null && activeRating >= star;
                  const isHalf = activeRating !== null && activeRating >= star - 0.5 && activeRating < star;

                  return (
                    <div key={star} className="relative text-3xl leading-none">
                      <span className="text-ink-muted/30">★</span>
                      <span className={`absolute top-0 left-0 overflow-hidden text-accent-gold pointer-events-none transition-all ${isFilled ? 'w-full' : isHalf ? 'w-1/2' : 'w-0'}`}>★</span>
                      
                      <button
                        className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
                        disabled={!user || ratingBusy}
                        onMouseEnter={() => setHoverRating(star - 0.5)}
                        onClick={() => handleRatingClick(star - 0.5)}
                      />
                      <button
                        className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
                        disabled={!user || ratingBusy}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => handleRatingClick(star)}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="absolute right-0 w-8" />
            </div>

            <span className="text-xs text-ink-muted uppercase tracking-wider font-bold mt-1">Rate this game</span>
            <span className="text-xs text-ink-muted mt-1">{game.rating_count.toLocaleString()} ratings</span>
          </div>

          {/* Status Dashboard */}
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center gap-6 py-2">
              
              {/* Played Button */}
              <button onClick={handlePlayedToggle} className="flex flex-col items-center gap-1 group/icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${isPlayed ? 'text-accent-green fill-accent-green/20' : 'text-ink-muted group-hover/icon:text-white'}`}>
                  <path d="M6 12h4m-2-2v4m6-4h.01M18 12h.01M17 6H7a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-2a5 5 0 0 0-5-5Z"/>
                </svg>
                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${isPlayed ? 'text-accent-green' : 'text-ink-muted'}`}>Played</span>
              </button>

              <div className="w-px h-10 bg-hairline" />

              {/* Beat Button */}
              <button onClick={handleBeatToggle} className="flex flex-col items-center gap-1 group/icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${isBeat ? 'text-accent-gold fill-accent-gold/20' : 'text-ink-muted group-hover/icon:text-white'}`}>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22h10c0-1.76-.85-3.25-2.03-3.79A1.11 1.11 0 0 1 14 17v-2.34M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z"/>
                </svg>
                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${isBeat ? 'text-accent-gold' : 'text-ink-muted'}`}>Beat</span>
              </button>
            </div>

            <div className="border-t border-hairline mt-2">
              <button onClick={() => setModalOpen(true)} className="w-full py-3 text-center text-sm font-bold text-ink-muted hover:text-white transition-colors">Review</button>
            </div>
            <div className="border-t border-hairline">
              <button onClick={() => alert('Lists coming soon!')} className="w-full py-3 text-center text-sm font-bold text-ink-muted hover:text-white transition-colors">Add to Lists</button>
            </div>
            <div className="border-t border-hairline">
              <button onClick={handleWishlistToggle} className={`w-full py-3 text-center text-sm font-bold transition-colors ${isWishlisted ? 'text-white' : 'text-ink-muted hover:text-white'}`}>
                {isWishlisted ? '✓ Want to Play' : 'Want to Play'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}