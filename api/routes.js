const express = require('express');
const { getMovieStream, getEpisodeStream } = require('./streaming');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version check
router.get('/version', (req, res) => {
  res.json({
    version: '11.2.3',
    apkUrl: 'https://github.com/pabloprodan/TungaTVFull/releases/download/v11.2.3/tunga-vip-11.2.3.apk',
    changelog: 'Conexión directa a VidSrc, mejor estabilidad en streams',
  });
});

/**
 * GET /api/movie/:tmdbId
 * Obtiene URL de stream directo para película
 * 
 * Ejemplo: /api/movie/550
 * Respuesta: { url: "https://...", headers: {...}, source: "vidsrc" }
 */
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    console.log(`[API] Buscando película TMDB: ${tmdbId}`);

    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ error: 'Invalid TMDB ID' });
    }

    const stream = await getMovieStream(parseInt(tmdbId));

    if (!stream) {
      console.log(`[API] No se encontró stream para película ${tmdbId}`);
      return res.status(404).json({ error: 'Stream not found' });
    }

    console.log(`[API] Stream encontrado: ${stream.source}`);
    return res.json(stream);
  } catch (error) {
    console.error('[API] Movie error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tv/:tmdbId/:season/:episode
 * Obtiene URL de stream directo para serie
 * 
 * Ejemplo: /api/tv/1399/1/1
 * Respuesta: { url: "https://...", headers: {...}, source: "vidsrc" }
 */
router.get('/tv/:tmdbId/:season/:episode', async (req, res) => {
  try {
    const { tmdbId, season, episode } = req.params;
    console.log(`[API] Buscando serie TMDB: ${tmdbId} S${season}E${episode}`);

    if (!tmdbId || !season || !episode || isNaN(tmdbId) || isNaN(season) || isNaN(episode)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const stream = await getEpisodeStream(
      parseInt(tmdbId),
      parseInt(season),
      parseInt(episode)
    );

    if (!stream) {
      console.log(`[API] No se encontró stream para ${tmdbId} S${season}E${episode}`);
      return res.status(404).json({ error: 'Stream not found' });
    }

    console.log(`[API] Stream encontrado: ${stream.source}`);
    return res.json(stream);
  } catch (error) {
    console.error('[API] Episode error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;