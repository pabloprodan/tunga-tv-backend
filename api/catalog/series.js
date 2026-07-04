const axios = require("axios");
module.exports = async (req, res) => {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/tv/popular", {
      params: { api_key: process.env.TMDB_KEY, language: req.query.language || "es-419", page: req.query.page || 1, region: "AR" }
    });
    const series = response.data.results.map(s => ({
      id: String(s.id), tmdb_id: String(s.id), title: s.name, overview: s.overview,
      poster_path: s.poster_path ? `https://image.tmdb.org/t/p/w342${s.poster_path}` : null,
      backdrop_path: s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : null,
      first_air_year: s.first_air_date ? parseInt(s.first_air_date.substring(0,4)) : null,
      rating: parseFloat((s.vote_average||0).toFixed(1)), genres: [], seasons: s.number_of_seasons||0
    }));
    res.setHeader("Access-Control-Allow-Origin","*");
    res.json({ results: series, page: response.data.page, total_pages: response.data.total_pages });
  } catch(e) { res.status(500).json({ error: e.message }); }
};