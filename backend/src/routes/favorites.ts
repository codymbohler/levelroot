import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/api/favorites/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
         f.position,
         g.id, g.slug, g.title, COALESCE(g.cover_override, g.cover) AS cover, g.release_date, g.average_rating, g.rating_count
       FROM favorites f
       JOIN games g ON g.id = f.game_id
       WHERE f.user_id = $1
       ORDER BY f.position ASC`,
      [userId]
    );

    return res.json({ favorites: result.rows });
  } catch (err) {
    console.error('get favorites error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.put('/api/favorites', requireAuth, async (req: AuthedRequest, res) => {
  const client = await pool.connect();
  try {
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length > 5) {
      return res.status(400).json({ error: 'gameIds must be an array of at most 5 game IDs' });
    }

    if (new Set(gameIds).size !== gameIds.length) {
      return res.status(400).json({ error: 'duplicate gameIds are not allowed' });
    }

    if (gameIds.length > 0) {
      const check = await pool.query(
        'SELECT id FROM games WHERE id = ANY($1::text[])',
        [gameIds]
      );
      if (check.rowCount !== gameIds.length) {
        return res.status(404).json({ error: 'one or more games not found' });
      }
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM favorites WHERE user_id = $1', [req.userId]);

    for (let i = 0; i < gameIds.length; i++) {
      await client.query(
        'INSERT INTO favorites (id, user_id, game_id, position) VALUES ($1, $2, $3, $4)',
        [randomUUID(), req.userId, gameIds[i], i + 1]
      );
    }

    await client.query('COMMIT');

    const result = await pool.query(
      `SELECT
         f.position,
         g.id, g.slug, g.title, COALESCE(g.cover_override, g.cover) AS cover, g.release_date, g.average_rating, g.rating_count
       FROM favorites f
       JOIN games g ON g.id = f.game_id
       WHERE f.user_id = $1
       ORDER BY f.position ASC`,
      [req.userId]
    );

    return res.json({ favorites: result.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('set favorites error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  } finally {
    client.release();
  }
});

export default router;