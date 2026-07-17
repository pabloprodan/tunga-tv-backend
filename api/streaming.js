const axios = require('axios');

// VidSrc API endpoints
const VIDSRC_BASE = 'https://vidsrc.xyz/api/source';
const VIDSRC_EMBED = 'https://vidsrc.xyz/embed';

// Headers para evitar bloqueos
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Android TV) AppleWebKit/537.36',
  'Referer': 'https://vidsrc.xyz/',
  'Accept': '*/*',
};

/**
 * Obtiene stream directo de película
 * GET /api/movie/:tmdbId
 */
async function getMovieStream(tmdbId) {
  try {
    const streamUrl = `${VIDSRC_EMBED}/movie/${tmdbId}`;
    
    // Obtener la página embed
    const pageRes = await axios.get(streamUrl, { headers: HEADERS, timeout: 10000 });
    if (!pageRes.data) throw new Error('No page data');

    // Extraer URL de fuente desde la página
    const sourceMatch = pageRes.data.match(/"source":\s*"([^"]+)"/);
    if (sourceMatch && sourceMatch[1]) {
      return {
        url: sourceMatch[1],
        headers: HEADERS,
        source: 'vidsrc',
      };
    }

    // Alternativa: intentar obtener desde la API de VidSrc
    const apiRes = await axios.get(`${VIDSRC_BASE}/movie/${tmdbId}`, { 
      headers: HEADERS, 
      timeout: 10000 
    }).catch(() => null);

    if (apiRes?.data?.sources?.[0]) {
      return {
        url: apiRes.data.sources[0].url,
        headers: HEADERS,
        source: 'vidsrc-api',
      };
    }

    return null;
  } catch (error) {
    console.error('[Streaming] Movie error:', error.message);
    return null;
  }
}

/**
 * Obtiene stream directo de serie
 * GET /api/tv/:tmdbId/:season/:episode
 */
async function getEpisodeStream(tmdbId, season, episode) {
  try {
    const streamUrl = `${VIDSRC_EMBED}/tv/${tmdbId}/${season}/${episode}`;
    
    // Obtener la página embed
    const pageRes = await axios.get(streamUrl, { headers: HEADERS, timeout: 10000 });
    if (!pageRes.data) throw new Error('No page data');

    // Extraer URL de fuente
    const sourceMatch = pageRes.data.match(/"source":\s*"([^"]+)"/);
    if (sourceMatch && sourceMatch[1]) {
      return {
        url: sourceMatch[1],
        headers: HEADERS,
        source: 'vidsrc',
      };
    }

    // Alternativa: API de VidSrc
    const apiRes = await axios.get(`${VIDSRC_BASE}/tv/${tmdbId}/${season}/${episode}`, { 
      headers: HEADERS, 
      timeout: 10000 
    }).catch(() => null);

    if (apiRes?.data?.sources?.[0]) {
      return {
        url: apiRes.data.sources[0].url,
        headers: HEADERS,
        source: 'vidsrc-api',
      };
    }

    return null;
  } catch (error) {
    console.error('[Streaming] Episode error:', error.message);
    return null;
  }
}

module.exports = {
  getMovieStream,
  getEpisodeStream,
};