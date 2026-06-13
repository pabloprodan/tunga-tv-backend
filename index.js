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
  res.json({ status: 'Tunga TV API is running!', version: '2.0' });
});

// ── SISTEMA DE ACTUALIZACIONES ─────────────────────────────────────────────
app.get('/api/version', (req, res) => {
  res.json({
    version: '11.2.2',
    apkUrl: 'https://github.com/pabloprodan/tunga-tv-backend/releases/download/v11.2.2/tunga-stream.apk',
    forceUpdate: false,
    changelog: 'Mejoras de estabilidad y rendimiento'
  });
});

// ── TMDB PROXY ─────────────────────────────────────────────────────────────
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

// ── FAVORITES ──────────────────────────────────────────────────────────────
app.post('/api/favorites', async (req, res) => {
  const { user_email, media_id, media_type, title, poster } = req.body;
  try {
    await pool.query(
      'INSERT INTO favorites (user_email, media_id, media_type, title, poster) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [user_email, media_id, media_type, title, poster]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/favorites', async (req, res) => {
  const { user_email, media_id } = req.body;
  try {
    await pool.query('DELETE FROM favorites WHERE user_email = $1 AND media_id = $2', [user_email, media_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/favorites/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM favorites WHERE user_email = $1 ORDER BY created_at DESC', [email]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM history WHERE user_email = $1 ORDER BY watched_at DESC LIMIT 50', [email]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Tunga TV Backend running on port ${PORT}`);
});
