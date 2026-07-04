const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_email TEXT,
        media_id TEXT,
        media_type TEXT,
        title TEXT,
        poster TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_email TEXT,
        media_id TEXT,
        media_type TEXT,
        title TEXT,
        poster TEXT,
        watched_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('DB initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
};
initDB();

app.get('/', (req, res) => {
  res.json({ status: 'Nova Stream API running!', version: '3.0' });
});

// ── VERSION ────────────────────────────────────────────────────────────────
app.get('/api/version', (req, res) => {
  res.json({
    version: '11.2.2',
    apkUrl: 'https://github.com/pabloprodan/tunga-tv-backend/releases/download/v11.2.2/tunga-stream.apk',
    forceUpdate: false,
    changelog: 'Mejoras de estabilidad y rendimiento'
  });
});

// ── TMDB PROXY LEGACY (Tunga Stream) ──────────────────────────────────────
app.get('/api/tmdb/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { api_key, ...query } = req.query;
    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, {
      params: { api_key: process.env.TMDB_KEY, language: 'es-ES', ...query }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ── NOVA STREAM — CATALOG ─────────────────────────────────────────────────
app.get('/api/catalog/movies', async (req, res) => {
  try {
    const page     = req.query.page     || 1;
    const language = req.query.language || 'es-419';
    const genre    = req.query.genre_id || null;
    const params   = { api_key: process.env.TMDB_KEY, language, page, region: 'AR' };
    if (genre) params.with_genres = genre;
    const endpoint = genre ? 'discover/movie' : 'movie/popular';
    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, { params });
    const movies = response.data.results.map(m => ({
      id:            String(m.id),
      tmdb_id:       String(m.id),
      title:         m.title,
      overview:      m.overview,
      poster_path:   m.poster_path   ? `https://image.tmdb.org/t/p/w342${m.poster_path}`   : null,
      backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      year:          m.release_date  ? parseInt(m.release_date.substring(0, 4)) : null,
      rating:        parseFloat((m.vote_average || 0).toFixed(1)),
      genres:        []
    }));
    res.json({ results: movies, page: response.data.page, total_pages: response.data.total_pages, total_results: response.data.total_results });
  } catch (error) {
    console.error('catalog/movies:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/catalog/series', async (req, res) => {
  try {
    const page     = req.query.page     || 1;
    const language = req.query.language || 'es-419';
    const response = await axios.get('https://api.themoviedb.org/3/tv/popular', {
      params: { api_key: process.env.TMDB_KEY, language, page, region: 'AR' }
    });
    const series = response.data.results.map(s => ({
      id:             String(s.id),
      tmdb_id:        String(s.id),
      title:          s.name,
      overview:       s.overview,
      poster_path:    s.poster_path   ? `https://image.tmdb.org/t/p/w342${s.poster_path}`   : null,
      backdrop_path:  s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : null,
      first_air_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : null,
      rating:         parseFloat((s.vote_average || 0).toFixed(1)),
      genres:         [],
      seasons:        s.number_of_seasons || 0
    }));
    res.json({ results: series, page: response.data.page, total_pages: response.data.total_pages, total_results: response.data.total_results });
  } catch (error) {
    console.error('catalog/series:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/catalog/movies/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const language   = req.query.language || 'es-419';
    const response   = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      params: { api_key: process.env.TMDB_KEY, language }
    });
    const m = response.data;
    res.json({
      id: String(m.id), tmdb_id: String(m.id), title: m.title, overview: m.overview,
      poster_path:   m.poster_path   ? `https://image.tmdb.org/t/p/w342${m.poster_path}`   : null,
      backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      year:    m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
      rating:  parseFloat((m.vote_average || 0).toFixed(1)),
      genres:  (m.genres || []).map(g => g.name),
      runtime: m.runtime || null
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/catalog/search', async (req, res) => {
  try {
    const q        = req.query.q || '';
    const language = req.query.language || 'es-419';
    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: process.env.TMDB_KEY, language, query: q }
    });
    const movies = response.data.results.map(m => ({
      id: String(m.id), tmdb_id: String(m.id), title: m.title, overview: m.overview,
      poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
      year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
      rating: parseFloat((m.vote_average || 0).toFixed(1)), genres: []
    }));
    res.json({ results: movies, page: 1 });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ── NOVA STREAM — STREAM RESOLVER (stub) ──────────────────────────────────
app.get('/api/resolve/:contentId', async (req, res) => {
  res.json({
    url:        'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    format:     'HLS',
    expires_at: 0
  });
});

// ── FAVORITES ──────────────────────────────────────────────────────────────
app.post('/api/favorites', async (req, res) => {
  const { user_email, media_id, media_type, title, poster } = req.body;
  try {
    await pool.query(
      'INSERT INTO favorites (user_email, media_id, media_type, title, poster) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [user_email, media_id, media_type, title, poster]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/favorites', async (req, res) => {
  const { user_email, media_id } = req.body;
  try {
    await pool.query('DELETE FROM favorites WHERE user_email = $1 AND media_id = $2', [user_email, media_id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/favorites/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM favorites WHERE user_email = $1 ORDER BY created_at DESC', [email]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── HISTORY ────────────────────────────────────────────────────────────────
app.post('/api/history', async (req, res) => {
  const { user_email, media_id, media_type, title, poster } = req.body;
  try {
    await pool.query(
      'INSERT INTO history (user_email, media_id, media_type, title, poster) VALUES ($1, $2, $3, $4, $5)',
      [user_email, media_id, media_type, title, poster]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM history WHERE user_email = $1 ORDER BY watched_at DESC LIMIT 50', [email]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
  console.log(`Nova Stream Backend running on port ${PORT}`);
});