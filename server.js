// Server nhỏ cho oracle-diagrams: phục vụ các trang sơ đồ và lưu nhận xét vào comments.json.
// Chạy:  node server.js            -> chỉ máy này (http://127.0.0.1:5501)
//        node server.js --lan      -> cho máy khác cùng mạng LAN/VPN truy cập (http://<IP máy>:5501)
//        PORT=8080 node server.js  -> đổi cổng
// Không cần cài thư viện; chỉ dùng module có sẵn của Node.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const FILE = path.join(ROOT, 'comments.json');
const PORT = Number(process.env.PORT) || 5501;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};
const HIDDEN = new Set(['server.js', '.git', '.gitignore', 'node_modules', '_old']);

const readComments = () => {
  try { const d = JSON.parse(fs.readFileSync(FILE, 'utf8')); return Array.isArray(d) ? d : []; }
  catch { return []; }
};
const writeComments = list => {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, FILE); // ghi tạm rồi đổi tên, tránh file hỏng nếu đang ghi dở
};

const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

// chống gửi dồn: mỗi IP tối đa 1 nhận xét / 5 giây
const lastPost = new Map();

const pad = n => String(n).padStart(2, '0');
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function postComment(req, res) {
  const ip = req.socket.remoteAddress || '';
  if (Date.now() - (lastPost.get(ip) || 0) < 5000) return send(res, 429, { error: 'Gửi nhanh quá, thử lại sau vài giây.' });
  let raw = '';
  req.setEncoding('utf8');
  req.on('data', c => { raw += c; if (raw.length > 10000) req.destroy(); });
  req.on('end', () => {
    let b;
    try { b = JSON.parse(raw); } catch { return send(res, 400, { error: 'Dữ liệu không hợp lệ.' }); }
    const diagram = String(b.diagram || '').trim();
    const author = String(b.author || '').trim().slice(0, 60);
    const text = String(b.text || '').trim();
    if (!/^[a-z0-9-]{1,40}$/.test(diagram)) return send(res, 400, { error: 'Sơ đồ không hợp lệ.' });
    if (!text || text.length > 2000) return send(res, 400, { error: 'Nội dung trống hoặc dài quá 2000 ký tự.' });
    const item = { diagram, author: author || 'Ẩn danh', date: now(), text };
    const list = readComments();
    list.push(item);
    writeComments(list);
    lastPost.set(ip, Date.now());
    console.log(`[nhận xét] ${item.date} · ${item.author} · ${diagram}`);
    send(res, 201, item);
  });
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep) || HIDDEN.has(rel.split('/')[0])) return send(res, 404, 'Not found', 'text/plain');
  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream');
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/comments') {
    if (req.method === 'GET') return send(res, 200, readComments());
    if (req.method === 'POST') return postComment(req, res);
    return send(res, 405, { error: 'Method not allowed' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  serveStatic(req, res);
}).listen(PORT, HOST, () => {
  console.log(`oracle-diagrams: http://127.0.0.1:${PORT}/`);
  if (HOST === '0.0.0.0') {
    Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
      .forEach(i => console.log(`  trong mạng LAN: http://${i.address}:${PORT}/`));
  }
  console.log(`Nhận xét lưu vào: ${FILE}`);
});
