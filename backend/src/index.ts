import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';
import logRoutes from './routes/logs';
import favoriteRoutes from './routes/favorites';
import listRoutes from './routes/lists';
import followRoutes from './routes/follows';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import wishlistRoutes from './routes/wishlist';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'levelroot',
    time: new Date().toISOString(),
  });
});

app.use(authRoutes);
app.use(gameRoutes);
app.use(logRoutes);
app.use(favoriteRoutes);
app.use(listRoutes);
app.use(followRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use(wishlistRoutes);

app.listen(PORT, () => {
  console.log(`Levelroot backend running on http://localhost:${PORT}`);
});