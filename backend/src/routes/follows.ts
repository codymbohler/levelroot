import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/api/follows/status/:userId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
      [req.userId, userId]
    );

    return res.json({ following: (result.rowCount ?? 0) > 0 });
  } catch (err) {
    console.error('follow status error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/api/follows/:userId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ error: 'you cannot follow yourself' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    await pool.query(
      `INSERT INTO follows (id, follower_id, following_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [randomUUID(), req.userId, userId]
    );

    return res.status(201).json({ following: true });
  } catch (err) {
    console.error('follow error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.delete('/api/follows/:userId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.userId, userId]
    );

    return res.json({ following: false });
  } catch (err) {
    console.error('unfollow error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/follows/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.json({ followers: result.rows });
  } catch (err) {
    console.error('followers error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/follows/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.json({ following: result.rows });
  } catch (err) {
    console.error('following error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;