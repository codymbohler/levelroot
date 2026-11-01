import { Link } from 'react-router-dom';
import type { GameLog } from '../lib/api';

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  beat: 'Beat',
  completed: 'Completed',
  dropped: 'Dropped',
};

function LogCard({ log }: { log: GameLog }) {
  const isCompleted = log.status === 'completed';

  return (
    <article className="border-b border-hairline pb-8 mb-8 last:border-0">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-charcoal overflow-hidden shrink-0">
          {log.avatar ? (
            <img src={log.avatar} alt={log.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-mute text-sm font-bold">
              {log.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <Link
            to={`/user/${log.username}`}
            className="text-sm font-medium hover:text-ps-blue transition-colors"
          >
            {log.display_name || log.username}
          </Link>
          <p className="text-xs text-ink-mute">
            {new Date(log.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full ${
            isCompleted
              ? 'text-black'
              : 'bg-ps-blue text-white'
          }`}
          style={
            isCompleted
              ? { background: 'linear-gradient(to right, #ffce21, #f5a623, #ee8e00)' }
              : undefined
          }
        >
          {STATUS_LABELS[log.status] || log.status}
        </span>
      </div>

      {/* Rating */}
      {log.rating !== null && (
        <div className="mt-3">
          <span className="text-ps-blue text-lg">
            {'★'.repeat(Math.floor(log.rating))}
            {log.rating % 1 >= 0.5 && '⯨'}
          </span>
          <span className="text-ink-mute text-sm ml-2">{log.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Quick take */}
      {log.quick_take && (
        <p className="text-ink mt-3 font-medium">{log.quick_take}</p>
      )}

      {/* Review */}
      {log.review && (
        <p className="text-ink-mute mt-3 leading-relaxed whitespace-pre-wrap">
          {log.review}
        </p>
      )}

      {/* Likes */}
      {log.like_count > 0 && (
        <p className="text-xs text-ink-mute mt-3">
          {log.like_count} {log.like_count === 1 ? 'like' : 'likes'}
        </p>
      )}
    </article>
  );
}

export default LogCard;