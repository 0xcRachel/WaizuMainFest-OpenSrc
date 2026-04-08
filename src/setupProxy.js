const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/steam',
    createProxyMiddleware({
      target: '',
      changeOrigin: true,
      pathRewrite: {
        '^/api/steam': '/api',
      },
      headers: {
        'Origin': '',
        'Referer': ''
      }
    })
  );
  
  app.use(
    '/api/github',
    createProxyMiddleware({
      target: '',
      changeOrigin: true,
      pathRewrite: {
        '^/api/github': '',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
  );
};