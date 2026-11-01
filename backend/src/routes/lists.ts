import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.post('/api/lists', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { title, description, isRanked, isPublic } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }

    const slug = slugify(title);
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO lists (id, user_id, title, slug, description, is_ranked, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, title, slug, description, is_ranked, is_public, like_count, created_at, updated_at`,
      [
        id,
        req.userId,
        title.trim(),
        slug,
        description ?? null,
        isRanked ?? false,
        isPublic ?? true,
      ]
    );

    return res.status(201).json({ list: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'you already have a list with that title' });
    }
    console.error('create list error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/lists/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const isOwnProfile = false; // anonymous request; own-profile handled client-side

    const result = await pool.query(
      `SELECT
         l.id, l.title, l.slug, l.description, l.is_ranked, l.is_public,
         l.like_count, l.created_at, l.updated_at,
         COUNT(li.id)::int AS item_count
       FROM lists l
       LEFT JOIN list_items li ON li.list_id = l.id
       WHERE l.user_id = $1 AND l.is_public = $2
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId, true]
    );

    return res.json({ lists: result.rows });
  } catch (err) {
    console.error('user lists error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/lists/mine', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT
         l.id, l.title, l.slug, l.description, l.is_ranked, l.is_public,
         l.like_count, l.created_at, l.updated_at,
         COUNT(li.id)::int AS item_count
       FROM lists l
       LEFT JOIN list_items li ON li.list_id = l.id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [req.userId]
    );

    return res.json({ lists: result.rows });
  } catch (err) {
    console.error('my lists error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/lists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listResult = await pool.query(
      `SELECT
         l.id, l.title, l.slug, l.description, l.is_ranked, l.is_public,
         l.like_count, l.created_at, l.updated_at,
         u.id AS user_id, u.username, u.display_name, u.avatar
       FROM lists l
       JOIN users u ON u.id = l.user_id
       WHERE l.id = $1
       LIMIT 1`,
      [id]
    );

    const list = listResult.rows[0];
    if (!list) {
      return res.status(404).json({ error: 'list not found' });
    }

    const itemsResult = await pool.query(
      `SELECT
         li.position,
         g.id, g.slug, g.title, g.cover, g.release_date, g.average_rating, g.rating_count
       FROM list_items li
       JOIN games g ON g.id = li.game_id
       WHERE li.list_id = $1
       ORDER BY li.position ASC`,
      [id]
    );

    return res.json({ list, items: itemsResult.rows });
  } catch (err) {
    console.error('list detail error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/api/lists/:id/items', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds must be a non-empty array' });
    }

    const ownerCheck = await pool.query(
      'SELECT user_id FROM lists WHERE id = $1 LIMIT 1',
      [id]
    );

    const list = ownerCheck.rows[0];
    if (!list) {
      return res.status(404).json({ error: 'list not found' });
    }
    if (list.user_id !== req.userId) {
      return res.status(403).json({ error: 'you do not own this list' });
    }

    const maxResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0)::int AS max_pos FROM list_items WHERE list_id = $1',
      [id]
    );
    let nextPosition = (maxResult.rows[0].max_pos as number) + 1;

    for (const gameId of gameIds) {
      await pool.query(
        `INSERT INTO list_items (id, list_id, game_id, position)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (list_id, position) DO NOTHING`,
        [randomUUID(), id, gameId, nextPosition]
      );
      nextPosition++;
    }

    const itemsResult = await pool.query(
      `SELECT
         li.position,
         g.id, g.slug, g.title, g.cover, g.release_date, g.average_rating, g.rating_count
       FROM list_items li
       JOIN games g ON g.id = li.game_id
       WHERE li.list_id = $1
       ORDER BY li.position ASC`,
      [id]
    );

    return res.json({ items: itemsResult.rows });
  } catch (err) {
    console.error('add list items error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;