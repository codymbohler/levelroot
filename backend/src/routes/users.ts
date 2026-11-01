import { Router } from 'express';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.put('/api/users/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { displayName, bio, avatar } = req.body;

    if (displayName !== undefined && displayName !== null) {
      if (typeof displayName !== 'string' || displayName.length > 50) {
        return res.status(400).json({ error: 'displayName must be a string under 50 characters' });
      }
    }

    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string' || bio.length > 500) {
        return res.status(400).json({ error: 'bio must be a string under 500 characters' });
      }
    }

    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar !== 'string' || avatar.length > 500) {
        return res.status(400).json({ error: 'avatar must be a URL under 500 characters' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET
         display_name = $1,
         bio = $2,
         avatar = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, display_name, bio, avatar, created_at,
                 (SELECT COUNT(*)::int FROM follows WHERE following_id = users.id) AS follower_count,
                 (SELECT COUNT(*)::int FROM follows WHERE follower_id = users.id) AS following_count`,
      [
        displayName?.trim() || null,
        bio?.trim() || null,
        avatar?.trim() || null,
        req.userId,
      ]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('update user error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await pool.query(
      `SELECT
         u.id, u.username, u.display_name, u.bio, u.avatar, u.created_at,
         (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS follower_count,
         (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following_count
       FROM users u
       WHERE u.username = $1
       LIMIT 1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('get user error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;