const axios = require("axios");
module.exports = async (req, res) => {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
      params: { api_key: process.env.TMDB_KEY, language: req.query.language || "es-419", page: req.query.page || 1, region: "AR" }
    });
    const movies = response.data.results.map(m => ({
      id: String(m.id), tmdb_id: String(m.id), title: m.title, overview: m.overview,
      poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
      backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      year: m.release_date ? parseInt(m.release_date.substring(0,4)) : null,
      rating: parseFloat((m.vote_average||0).toFixed(1)), genres: []
    }));
    res.setHeader("Access-Control-Allow-Origin","*");
    res.json({ results: movies, page: response.data.page, total_pages: response.data.total_pages });
  } catch(e) { res.status(500).json({ error: e.message }); }
};