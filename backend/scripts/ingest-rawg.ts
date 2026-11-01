import 'dotenv/config';
import { pool } from '../src/lib/db';

const RAWG_KEY = process.env.RAWG_KEY;
if (!RAWG_KEY) throw new Error('RAWG_KEY is not set in .env');

// We will loop from the current year backward
const CURRENT_YEAR = 2026;
const START_YEAR = 1990;
const GAMES_PER_YEAR = 20; // How many games to grab per year

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
};

async function fetchGamesByYear(year: number): Promise<RawgGame[]> {
  const url = new URL('https://api.rawg.io/api/games');
  url.searchParams.set('key', RAWG_KEY as string);
  url.searchParams.set('dates', `${year}-01-01,${year}-12-31`);
  url.searchParams.set('page_size', String(GAMES_PER_YEAR));
  url.searchParams.set('ordering', '-added'); // Most added to libraries (popularity)
  url.searchParams.set('exclude_additions', 'true'); // No DLCs/Editions

  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { results: RawgGame[] };
  return data.results;
}

async function insertGame(g: RawgGame): Promise<boolean> {
  if (!g.background_image) return false;

  const existing = await pool.query('SELECT id FROM games WHERE rawg_id = $1', [g.id]);
  if (existing.rowCount && existing.rowCount > 0) return false;

  // Fetch full details for synopsis and studios
  const detailUrl = new URL(`https://api.rawg.io/api/games/${g.id}`);
  detailUrl.searchParams.set('key', RAWG_KEY as string);
  
  const detailRes = await fetch(detailUrl);
  if (!detailRes.ok) return false;
  const details = (await detailRes.json()) as any;

  // Fetch screenshots from the dedicated endpoint
  const screenshotsUrl = new URL(`https://api.rawg.io/api/games/${g.id}/screenshots`);
  screenshotsUrl.searchParams.set('key', RAWG_KEY as string);
  const screenshotsRes = await fetch(screenshotsUrl);
  let screenshots: string[] = [];
  if (screenshotsRes.ok) {
    const screenshotData = (await screenshotsRes.json()) as any;
        screenshots = screenshotData.results 
      ? screenshotData.results.map((s: any) => s.image).slice(0, 12) 
      : [];
  }
  
    // Fetch trailer
  const moviesUrl = new URL(`https://api.rawg.io/api/games/${g.id}/movies`);
  moviesUrl.searchParams.set('key', RAWG_KEY as string);
  const moviesRes = await fetch(moviesUrl);
  let trailerUrl: string | null = null;
  if (moviesRes.ok) {
    const moviesData = (await moviesRes.json()) as any;
    if (moviesData.results && moviesData.results.length > 0) {
      trailerUrl = moviesData.results[0].data?.[480] || moviesData.results[0].data?.max || null;
    }
  }

  const genres = details.genres ? details.genres.map((genre: any) => genre.name) : [];
  const developers = details.developers ? details.developers.map((dev: any) => dev.name) : [];
  const publishers = details.publishers ? details.publishers.map((pub: any) => pub.name) : [];

  await pool.query(
    `INSERT INTO games (
      id, rawg_id, slug, title, cover, release_date, 
      average_rating, rating_count, description, 
      genres, developers, publishers, screenshots, trailer_url
    )
     VALUES (
      gen_random_uuid()::text, $1, $2, $3, $4, $5, 
      $6, $7, $8, 
      $9, $10, $11, $12, $13
    )`,
    [
      details.id,
      details.slug,
      details.name,
      details.background_image,
      details.released || null,
      details.rating || null,
      details.ratings_count || 0,
      details.description_raw || null, 
      genres,
      developers,
      publishers,
      screenshots,
      trailerUrl, // <-- Add this
    ]
  );

  return true;
}

async function main() {
  let totalInserted = 0;

  // Loop from 2026 down to 1990
  for (let year = CURRENT_YEAR; year >= START_YEAR; year--) {
    console.log(`\n--- Fetching top games of ${year} ---`);
    
    try {
      const games = await fetchGamesByYear(year);
      
      for (const g of games) {
        const ok = await insertGame(g);
        if (ok) {
          totalInserted++;
          console.log(`  [${year}] ${g.name}`);
        }
      }
    } catch (err: any) {
      console.error(`Failed to fetch year ${year}:`, err.message);
    }
    
    // Slight delay to respect RAWG rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. Inserted ${totalInserted} games spanning ${START_YEAR}-${CURRENT_YEAR}.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});