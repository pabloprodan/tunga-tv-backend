const express = require('express');
const cors = require('cors');
const apiRoutes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'TungaTV Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      version: 'GET /api/version',
      movie: 'GET /api/movie/:tmdbId',
      series: 'GET /api/tv/:tmdbId/:season/:episode',
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 TungaTV Backend running on port ${PORT}`);
});

module.exports = app;