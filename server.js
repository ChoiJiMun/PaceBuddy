const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { put, list } = require('@vercel/blob');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SLIDES_FILE = path.join(DATA_DIR, 'hero-slides.json');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const HERO_SLIDES_BLOB_PATH = 'config/hero-slides.json';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const DEFAULT_SLIDES = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1800&q=80',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1800&q=80'
];

async function ensureDataFile() {
  if (BLOB_ENABLED) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(SLIDES_FILE);
  } catch {
    await fs.writeFile(
      SLIDES_FILE,
      JSON.stringify({ slides: DEFAULT_SLIDES }, null, 2),
      'utf8'
    );
  }
}

async function readSlidesFromBlob() {
  const { blobs } = await list({ prefix: HERO_SLIDES_BLOB_PATH, limit: 10 });
  const target = blobs
    .filter((blob) => blob.pathname === HERO_SLIDES_BLOB_PATH)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

  if (!target) {
    const created = await writeSlidesToBlob(DEFAULT_SLIDES);
    return created;
  }

  const response = await fetch(target.url);
  if (!response.ok) return { slides: DEFAULT_SLIDES };
  const parsed = await response.json();
  if (!Array.isArray(parsed?.slides)) return { slides: DEFAULT_SLIDES };
  return {
    slides: parsed.slides.filter(
      (url) => typeof url === 'string' && url.trim().length > 0
    )
  };
}

async function writeSlidesToBlob(slides) {
  const sanitized = slides
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (sanitized.length === 0) {
    throw new Error('슬라이드 이미지는 최소 1개 이상 필요합니다.');
  }

  await put(HERO_SLIDES_BLOB_PATH, JSON.stringify({ slides: sanitized }, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8'
  });
  return { slides: sanitized };
}

function safeFilename(name = 'image') {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function extensionFromMime(mimeType = '') {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  };
  return map[mimeType] || '';
}

async function saveUploadedImage({ filename, mimeType, contentBase64 }) {
  if (!mimeType || !mimeType.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }
  if (!contentBase64 || typeof contentBase64 !== 'string') {
    throw new Error('업로드 데이터가 비어 있습니다.');
  }

  const approxBytes = Math.floor((contentBase64.length * 3) / 4);
  if (approxBytes > 10 * 1024 * 1024) {
    throw new Error('이미지 용량은 10MB 이하만 가능합니다.');
  }

  const original = safeFilename(filename || 'upload');
  const originalExt = path.extname(original).toLowerCase();
  const ext = originalExt || extensionFromMime(mimeType) || '.bin';
  const baseName = path.basename(original, originalExt || undefined) || 'upload';
  const savedName = `${Date.now()}-${baseName}${ext}`;
  const buffer = Buffer.from(contentBase64, 'base64');
  if (BLOB_ENABLED) {
    const blob = await put(`hero/${savedName}`, buffer, {
      access: 'public',
      contentType: mimeType
    });
    return { url: blob.url };
  }

  const savePath = path.join(UPLOADS_DIR, savedName);
  await fs.writeFile(savePath, buffer);
  return { url: `/uploads/${savedName}` };
}

async function readSlides() {
  if (BLOB_ENABLED) {
    return readSlidesFromBlob();
  }

  await ensureDataFile();
  const raw = await fs.readFile(SLIDES_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.slides)) return { slides: DEFAULT_SLIDES };
  return {
    slides: parsed.slides.filter(
      (url) => typeof url === 'string' && url.trim().length > 0
    )
  };
}

async function writeSlides(slides) {
  if (BLOB_ENABLED) {
    return writeSlidesToBlob(slides);
  }

  await ensureDataFile();
  const sanitized = slides
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (sanitized.length === 0) {
    throw new Error('슬라이드 이미지는 최소 1개 이상 필요합니다.');
  }
  await fs.writeFile(
    SLIDES_FILE,
    JSON.stringify({ slides: sanitized }, null, 2),
    'utf8'
  );
  return { slides: sanitized };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': MIME_TYPES['.json'] });
  res.end(JSON.stringify(payload));
}

function resolveSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let normalizedPath = decoded === '/' ? '/test1.html' : decoded;
  if (normalizedPath === '/admin' || normalizedPath === '/admin/') {
    normalizedPath = '/admin/dist/index.html';
  }
  const fullPath = path.join(ROOT_DIR, normalizedPath);
  const safePath = path.normalize(fullPath);
  if (!safePath.startsWith(path.normalize(ROOT_DIR))) return null;
  return safePath;
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error('요청 본문이 너무 큽니다.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function requestHandler(req, res) {
  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const requestPath = parsedUrl.searchParams.get('path') || parsedUrl.pathname;
    const isHeroSlidesApi =
      requestPath === '/api/hero-slides' ||
      requestPath === '/hero-slides' ||
      requestPath.endsWith('/api/hero-slides');
    const isHeroUploadApi =
      requestPath === '/api/hero-upload' ||
      requestPath === '/hero-upload' ||
      requestPath.endsWith('/api/hero-upload');

    if (isHeroSlidesApi && req.method === 'GET') {
      const data = await readSlides();
      return sendJson(res, 200, data);
    }

    if (isHeroSlidesApi && req.method === 'PUT') {
      const body = await parseRequestBody(req);
      const parsed = JSON.parse(body || '{}');
      if (!Array.isArray(parsed?.slides)) {
        return sendJson(res, 400, { message: '`slides` 배열이 필요합니다.' });
      }
      const saved = await writeSlides(parsed.slides);
      return sendJson(res, 200, { message: '저장되었습니다.', ...saved });
    }

    if (isHeroUploadApi && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const parsed = JSON.parse(body || '{}');
      const uploaded = await saveUploadedImage({
        filename: parsed?.filename,
        mimeType: parsed?.mimeType,
        contentBase64: parsed?.contentBase64
      });
      return sendJson(res, 200, uploaded);
    }

    const filePath = resolveSafePath(requestPath || '/');
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Forbidden');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { message: 'JSON 형식이 올바르지 않습니다.' });
    }
    return sendJson(res, 500, { message: error.message || '서버 오류' });
  }
}

module.exports = requestHandler;

if (require.main === module) {
  const server = http.createServer(requestHandler);
  ensureDataFile().then(() => {
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log('메인 페이지: /test1.html');
      console.log('어드민 페이지: /admin.html');
      if (BLOB_ENABLED) {
        console.log('저장 모드: Vercel Blob');
      } else {
        console.log('저장 모드: Local file system');
      }
    });
  });
}
