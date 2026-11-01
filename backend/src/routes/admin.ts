import { Router } from 'express';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

// Middleware to check if the user is an admin
async function requireAdmin(req: AuthedRequest, res: any, next: any) {
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// Update a game
router.put('/api/admin/games/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, developers, publishers, genres, bannerImage, coverOverride } = req.body;

    const result = await pool.query(
      `UPDATE games SET
         title = COALESCE($1, title),
         description = $2,
         developers = $3,
         publishers = $4,
         genres = $5,
         banner_image = $6,
         cover_override = $7,
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, developers, publishers, genres, bannerImage, coverOverride, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json({ game: result.rows[0] });
  } catch (err) {
    console.error('admin update game error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;