import { Link } from 'react-router-dom';
import type { UserLog } from '../lib/api';

export default function ReviewListCard({ log, hideGame = false }: { log: UserLog, hideGame?: boolean }) {
  return (
    <article className="flex gap-6 py-6 border-b border-hairline last:border-0 group">
      {!hideGame && (
        <Link
          to={`/games/${log.game_slug}`}
          className="w-24 shrink-0 self-start rounded-md overflow-hidden bg-charcoal block hover:scale-105 transition-transform duration-300 aspect-[3/4]"
        >
          {log.game_cover ? (
            <img src={log.game_cover} alt={log.game_title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs text-center p-2">
              no cover
            </div>
          )}
        </Link>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          {hideGame ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-charcoal overflow-hidden shrink-0">
                {log.avatar ? (
                  <img src={log.avatar} alt={log.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted font-bold text-xs">
                    {log.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <Link to={`/user/${log.username}`} className="text-base font-medium hover:text-accent-green transition-colors">
                {log.display_name || log.username}
              </Link>
            </div>
          ) : (
            <Link
              to={`/games/${log.game_slug}`}
              className="text-xl font-display font-medium hover:text-accent-green transition-colors leading-tight"
            >
              {log.game_title}
            </Link>
          )}

          {/* BADGE */}
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ml-2 ${
              log.is_beat ? 'text-black' : 'bg-accent-green text-white'
            }`}
            style={
              log.is_beat
                ? { background: 'linear-gradient(to right, #ffce21, #f5a623, #ee8e00)' }
                : undefined
            }
          >
            {log.is_beat ? 'Beat' : 'Played'}
          </span>

          {log.rating !== null && (
            <span className="text-accent-gold text-sm tracking-widest ml-auto">
              {'★'.repeat(Math.floor(log.rating))}
              {log.rating % 1 >= 0.5 && '⯨'}
            </span>
          )}
        </div>

        <p className="text-xs text-ink-muted mb-3">
          {new Date(log.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {log.played_on && ` · played on ${log.played_on}`}
        </p>

        {log.quick_take && (
          <p className="text-ink font-medium text-lg mb-2">"{log.quick_take}"</p>
        )}

        {log.review && (
          <p className="text-ink-muted leading-relaxed text-sm whitespace-pre-wrap">
            {log.review}
          </p>
        )}
      </div>
    </article>
  );
}