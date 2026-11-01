import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { verifyToken } from '../lib/jwt';

const router = Router();

// 1. UPDATE RATING OR BEAT STATUS
router.post('/api/logs/update', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { gameId, rating, isBeat, isPlayed } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId is required' });

    const existing = await pool.query(
      'SELECT * FROM logs WHERE user_id = $1 AND game_id = $2 ORDER BY created_at DESC LIMIT 1',
      [req.userId, gameId]
    );

    // 1. If the user is turning OFF "Played", delete the log entirely
    if (isPlayed === false) {
      if (existing.rowCount && existing.rowCount > 0) {
        await pool.query('DELETE FROM logs WHERE id = $1', [existing.rows[0].id]);
      }
      return res.json({ log: null });
    }

    // 2. If they are turning ON "Beat", force "Played" to be true
    const forcePlayed = isPlayed || isBeat ? true : undefined;

    let result;
    if (existing.rowCount && existing.rowCount > 0) {
      const log = existing.rows[0];
      
      const newRating = rating === null ? null : (rating !== undefined ? rating : log.rating);
      const newBeat = isBeat === null ? false : (isBeat !== undefined ? isBeat : log.is_beat);
      const newPlayed = forcePlayed !== undefined ? forcePlayed : log.is_played;

      result = await pool.query(
        `UPDATE logs SET rating = $1, is_beat = $2, is_played = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
        [newRating, newBeat, newPlayed, log.id]
      );
    } else {
      // 3. If no log exists, create one
      result = await pool.query(
        `INSERT INTO logs (id, user_id, game_id, rating, is_beat, is_played)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5) RETURNING *`,
        [req.userId, gameId, rating || null, isBeat || false, forcePlayed || true]
      );
    }

    return res.json({ log: result.rows[0] });
  } catch (err) {
    console.error('update log error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

// 2. CREATE A REVIEW (FROM MODAL)
router.post('/api/logs', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { gameId, rating, isBeat, review, quickTake, playedOn } = req.body;
    
    const result = await pool.query(
      `INSERT INTO logs (id, user_id, game_id, rating, is_beat, is_played, review, quick_take, played_on)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, TRUE, $5, $6, $7) RETURNING *`,
      [req.userId, gameId, rating || null, isBeat || false, review || null, quickTake || null, playedOn || null]
    );

    return res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    console.error('create review error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

// 3. DELETE LOG (FROM PROFILE PAGE)
router.delete('/api/logs/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT user_id FROM logs WHERE id = $1 LIMIT 1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'log not found' });
    if (existing.rows[0].user_id !== req.userId) return res.status(403).json({ error: 'unauthorized' });

    await pool.query('DELETE FROM logs WHERE id = $1', [id]);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('delete log error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

// 4. GET GAME LOGS
router.get('/api/logs/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await pool.query(
      `SELECT l.*, u.username, u.display_name, u.avatar
       FROM logs l
       JOIN users u ON u.id = l.user_id
       WHERE l.game_id = $1
       ORDER BY l.created_at DESC`,
      [gameId]
    );
    return res.json({ logs: result.rows });
  } catch (err) {
    console.error('game logs error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

// 5. GET USER LOGS (For Profile Pages)
router.get('/api/logs/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT
         l.*, 
         g.slug AS game_slug, g.title AS game_title, g.cover AS game_cover, g.release_date AS game_release_date
       FROM logs l
       JOIN games g ON g.id = l.game_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return res.json({ logs: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'something went wrong' });
  }
});

// 6. GET RECENT LOGS (For Home Page Feed)
router.get('/api/logs/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '30'), 10) || 30, 100);
    const following = req.query.following === 'true';

    let requesterId: string | null = null;
    if (following) {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'authentication required for following feed' });
      }
      try {
        const payload = verifyToken(header.slice('Bearer '.length));
        requesterId = payload.userId;
      } catch {
        return res.status(401).json({ error: 'invalid or expired token' });
      }
    }

    const query = `
      SELECT
        l.id, l.is_played, l.is_beat, l.rating, l.review, l.quick_take, l.played_on, l.created_at,
        u.id AS user_id, u.username, u.display_name, u.avatar,
        g.id AS game_id, g.slug AS game_slug, g.title AS game_title,
        g.cover AS game_cover, g.release_date AS game_release_date
      FROM logs l
      JOIN users u ON u.id = l.user_id
      JOIN games g ON g.id = l.game_id
    `;

    let result;
    if (following) {
      result = await pool.query(
        `${query}
         WHERE l.user_id = $2
            OR l.user_id IN (SELECT following_id FROM follows WHERE follower_id = $2)
         ORDER BY l.created_at DESC
         LIMIT $1`,
        [limit, requesterId]
      );
    } else {
      result = await pool.query(
        `${query}
         ORDER BY l.created_at DESC
         LIMIT $1`,
        [limit]
      );
    }

    return res.json({ logs: result.rows });
  } catch (err) {
    console.error('recent logs error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;