// Vercel Serverless Function: /api/comments
// GET  -> danh sách nhận xét (đọc comments.json trực tiếp từ repo GitHub, luôn mới nhất)
// POST -> thêm nhận xét: ghi thêm vào comments.json trong repo (tạo một commit)
//
// Biến môi trường cần đặt trên Vercel (Project > Settings > Environment Variables):
//   GITHUB_TOKEN   fine-grained token, chỉ repo oracle-diagrams, quyền Contents: Read and write
//   GITHUB_REPO    QuocThinhPham/oracle-diagrams   (mặc định)
//   GITHUB_BRANCH  main                            (mặc định)

const REPO = process.env.GITHUB_REPO || 'QuocThinhPham/oracle-diagrams';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE = 'comments.json';
const API = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const gh = (url, init = {}) => fetch(url, {
  ...init,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'oracle-diagrams-comments',
    ...(init.headers || {}),
  },
});

async function load() {
  const r = await gh(`${API}?ref=${encodeURIComponent(BRANCH)}`);
  if (r.status === 404) return { list: [], sha: undefined };
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const d = await r.json();
  let list = [];
  try { list = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8')); } catch { list = []; }
  return { list: Array.isArray(list) ? list : [], sha: d.sha };
}

// chống gửi dồn (trong một instance): mỗi IP 1 nhận xét / 5 giây
const lastPost = new Map();

const pad = n => String(n).padStart(2, '0');
function nowVN() { // giờ Việt Nam (UTC+7)
  const d = new Date(Date.now() + 7 * 3600e3);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(JSON.parse(req.body));
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*'); // cho phép trang GitHub Pages gọi tới
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: 'Chưa cấu hình GITHUB_TOKEN trên Vercel.' });

  try {
    if (req.method === 'GET') return res.status(200).json((await load()).list);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (Date.now() - (lastPost.get(ip) || 0) < 5000) return res.status(429).json({ error: 'Gửi nhanh quá, thử lại sau vài giây.' });

    let b;
    try { b = await readBody(req); } catch { return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' }); }
    const diagram = String(b.diagram || '').trim();
    const author = String(b.author || '').trim().slice(0, 60) || 'Ẩn danh';
    const text = String(b.text || '').trim();
    if (!/^[a-z0-9-]{1,40}$/.test(diagram)) return res.status(400).json({ error: 'Sơ đồ không hợp lệ.' });
    if (!text || text.length > 2000) return res.status(400).json({ error: 'Nội dung trống hoặc dài quá 2000 ký tự.' });
    const item = { diagram, author, date: nowVN(), text };

    // đọc - thêm - ghi; nếu có người ghi cùng lúc (409) thì thử lại
    for (let attempt = 0; attempt < 3; attempt++) {
      const { list, sha } = await load();
      list.push(item);
      const r = await gh(API, {
        method: 'PUT',
        body: JSON.stringify({
          message: `comment: ${author} · ${diagram}`,
          content: Buffer.from(JSON.stringify(list, null, 2) + '\n', 'utf8').toString('base64'),
          branch: BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });
      if (r.ok) { lastPost.set(ip, Date.now()); return res.status(201).json(item); }
      if (r.status !== 409 && r.status !== 422) throw new Error(`GitHub ${r.status}`);
    }
    return res.status(503).json({ error: 'Đang bận, thử lại sau.' });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Không lưu được nhận xét, thử lại sau.' });
  }
};
