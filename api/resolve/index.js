module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.json({ url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", format: "HLS", expires_at: 0 });
};