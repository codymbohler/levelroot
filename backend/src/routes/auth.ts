import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';
import { signToken } from '../lib/jwt';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email, username]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: 'email or username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO users (id, email, username, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, bio, avatar, banner_image, is_admin, created_at`,
      [id, email, username, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, username, password, display_name, bio, avatar, banner_image, is_admin, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = signToken({ userId: user.id });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar: user.avatar,
        banner_image: user.banner_image,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

router.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, display_name, bio, avatar, banner_image, is_admin, created_at FROM users WHERE id = $1 LIMIT 1',
      [req.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;