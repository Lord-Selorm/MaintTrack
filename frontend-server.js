const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.FRONTEND_PORT || 8000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const ROOT_DIR = __dirname;

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

function proxyToBackend(req, res, pathname) {
  const target = new URL(pathname, BACKEND_URL);
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: { ...req.headers, host: target.host }
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const proxyReq = http.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers, 'Access-Control-Allow-Origin': '*' };
    res.writeHead(proxyRes.statusCode || 502, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Backend unavailable', details: err.message }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname.startsWith('/api')) {
    proxyToBackend(req, res, pathname + requestUrl.search);
    return;
  }

  let filePath = pathname === '/' ? '/maintenance_tracker.html' : pathname;
  if (filePath.endsWith('/')) filePath += 'maintenance_tracker.html';

  const normalizedPath = path.normalize(path.join(ROOT_DIR, filePath.replace(/^\/+/, '')));
  if (!normalizedPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, normalizedPath);
      return;
    }

    const fallbackPath = path.join(ROOT_DIR, 'maintenance_tracker.html');
    sendFile(res, fallbackPath);
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log(`API requests are proxied to ${BACKEND_URL}`);
});
