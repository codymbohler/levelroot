import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.post('/api/wishlist/toggle', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { gameId } = req.body;
    
    const existing = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND game_id = $2',
      [req.userId, gameId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND game_id = $2', [req.userId, gameId]);
      return res.json({ wishlisted: false });
    } else {
      await pool.query(
        'INSERT INTO wishlist (id, user_id, game_id) VALUES ($1, $2, $3)',
        [randomUUID(), req.userId, gameId]
      );
      return res.json({ wishlisted: true });
    }
  } catch (err) {
    console.error('wishlist toggle error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT g.*, COALESCE(g.cover_override, g.cover) AS cover 
       FROM wishlist w 
       JOIN games g ON g.id = w.game_id 
       WHERE w.user_id = $1 
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.json({ games: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;