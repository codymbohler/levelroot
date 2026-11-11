import { Router } from 'express';
import { pool } from '../lib/db';

const router = Router();

router.get('/api/games', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'rating_count';
    
    // Filtering logic
    const developer = typeof req.query.developer === 'string' ? req.query.developer : null;
    const publisher = typeof req.query.publisher === 'string' ? req.query.publisher : null;
    const genre = typeof req.query.genre === 'string' ? req.query.genre : null;

    let orderBy = 'rating_count DESC, title ASC';
    if (sort === 'title') orderBy = 'title ASC';
    else if (sort === 'release_date') orderBy = 'release_date DESC NULLS LAST';
    else if (sort === 'average_rating') orderBy = 'average_rating DESC NULLS LAST, rating_count DESC';

    let whereClauses = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (q) {
      whereClauses.push(`title ILIKE $${paramIndex}`);
      values.push(`%${q}%`);
      paramIndex++;
    }
    if (developer) {
      whereClauses.push(`$${paramIndex} = ANY(developers)`);
      values.push(developer);
      paramIndex++;
    }
    if (publisher) {
      whereClauses.push(`$${paramIndex} = ANY(publishers)`);
      values.push(publisher);
      paramIndex++;
    }
    if (genre) {
      whereClauses.push(`$${paramIndex} = ANY(genres)`);
      values.push(genre);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT id, slug, title, COALESCE(cover_override, cover) AS cover, release_date, average_rating, rating_count
       FROM games
       ${whereString}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM games ${whereString}`,
      values
    );
    const total = countResult.rows[0].total;

    return res.json({
      games: result.rows,
      pagination: { limit, offset, total },
    });
  } catch (err) {
    console.error('games list error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/games/featured', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, COALESCE(cover_override, cover) AS cover, release_date, average_rating, rating_count, screenshots, banner_image
       FROM games
       WHERE cover IS NOT NULL AND rating_count > 500
       ORDER BY RANDOM()
       LIMIT 5`
    );
    return res.json({ games: result.rows });
  } catch (err) {
    console.error('featured games error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT id, rawg_id, slug, title, cover, cover_override, release_date, description, average_rating, rating_count, genres, developers, publishers, screenshots, banner_image, trailer_url
       FROM games
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    const game = result.rows[0];
    if (!game) {
      return res.status(404).json({ error: 'game not found' });
    }

    return res.json({ game });
  } catch (err) {
    console.error('game fetch error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;