const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const CHATWOOT_HOST = 'n8n-chatwoot.mnch9q.easypanel.host';
const CHATWOOT_TOKEN = 'ttroYa5QcXG6YsQNbHnmtopD';
const SUPABASE_HOST = 'hduuuxbkvphreirlxzll.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OMiUdHI009VQL5Id0eNPgQ_n32Z7S9l';

function proxyRequest(req, res, targetHost, targetPath, extraHeaders = {}) {
  const options = {
    hostname: targetHost,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: { ...extraHeaders }
  };

  const proxyReq = https.request(options, proxyRes => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', e => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy Chatwoot API
  if (pathname.startsWith('/cw/')) {
    const targetPath = '/api/v1' + pathname.slice(3) + (parsed.search || '');
    proxyRequest(req, res, CHATWOOT_HOST, targetPath, {
      'api_access_token': CHATWOOT_TOKEN,
      'Content-Type': 'application/json'
    });
    return;
  }

  // Proxy Supabase API
  if (pathname.startsWith('/sb/')) {
    const targetPath = '/rest/v1' + pathname.slice(3) + (parsed.search || '');
    proxyRequest(req, res, SUPABASE_HOST, targetPath, {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': req.headers['prefer'] || ''
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? '/crm_sottcor.html' : pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + pathname); return; }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(data);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ CRM Server corriendo en http://localhost:${PORT}/crm_sottcor.html`));
