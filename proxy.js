/**
 * Dev proxy: forwards all requests to Expo (port 8081) and injects
 * the cross-origin isolation headers required by expo-sqlite's WASM/OPFS layer.
 *
 * Usage:  node proxy.js
 * Then open: http://localhost:8083
 */

const http = require('http');
const net = require('net');

const EXPO_PORT = 8081;
const PROXY_PORT = 8083;

const COOP_HEADERS = {
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
};

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: EXPO_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (proxyRes) => {
    // Inject isolation headers into every response
    const headers = { ...proxyRes.headers, ...COOP_HEADERS };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('[proxy] Error:', err.message);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy, { end: true });
});

// WebSocket passthrough (needed for Metro hot-reload)
server.on('upgrade', (req, socket, head) => {
  const conn = net.connect(EXPO_PORT, 'localhost', () => {
    conn.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    conn.write(head);
    socket.pipe(conn);
    conn.pipe(socket);
  });
  conn.on('error', (err) => {
    console.error('[proxy] WS error:', err.message);
    socket.destroy();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PROXY_PORT}`);
  console.log(`[proxy] Forwarding to Expo on port ${EXPO_PORT}`);
  console.log('[proxy] Cross-origin isolation headers: ON');
});
