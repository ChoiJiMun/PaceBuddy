const fs = require('fs/promises');
const path = require('path');
const { put, list } = require('@vercel/blob');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SLIDES_FILE = path.join(DATA_DIR, 'hero-slides.json');
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const HERO_SLIDES_BLOB_PATH = 'config/hero-slides.json';
const DEFAULT_SLIDES = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1800&q=80',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1800&q=80'
];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sanitizeSlides(slides) {
  return slides
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

async function readSlidesFromBlob() {
  const { blobs } = await list({ prefix: HERO_SLIDES_BLOB_PATH, limit: 10 });
  const target = blobs
    .filter((blob) => blob.pathname === HERO_SLIDES_BLOB_PATH)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  if (!target) return { slides: DEFAULT_SLIDES };

  const response = await fetch(target.url);
  if (!response.ok) return { slides: DEFAULT_SLIDES };
  const parsed = await response.json();
  if (!Array.isArray(parsed?.slides)) return { slides: DEFAULT_SLIDES };
  return { slides: sanitizeSlides(parsed.slides) };
}

async function readSlidesFromFile() {
  try {
    const raw = await fs.readFile(SLIDES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.slides)) return { slides: DEFAULT_SLIDES };
    return { slides: sanitizeSlides(parsed.slides) };
  } catch {
    return { slides: DEFAULT_SLIDES };
  }
}

async function writeSlidesToBlob(slides) {
  const sanitized = sanitizeSlides(slides);
  if (sanitized.length === 0) throw new Error('슬라이드 이미지는 최소 1개 이상 필요합니다.');
  await put(HERO_SLIDES_BLOB_PATH, JSON.stringify({ slides: sanitized }, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8'
  });
  return { slides: sanitized };
}

async function writeSlidesToFile(slides) {
  const sanitized = sanitizeSlides(slides);
  if (sanitized.length === 0) throw new Error('슬라이드 이미지는 최소 1개 이상 필요합니다.');
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SLIDES_FILE, JSON.stringify({ slides: sanitized }, null, 2), 'utf8');
  return { slides: sanitized };
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) reject(new Error('요청 본문이 너무 큽니다.'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const data = BLOB_ENABLED ? await readSlidesFromBlob() : await readSlidesFromFile();
      return sendJson(res, 200, data);
    }

    if (req.method === 'PUT') {
      const body = await parseRequestBody(req);
      const parsed = JSON.parse(body || '{}');
      if (!Array.isArray(parsed?.slides)) {
        return sendJson(res, 400, { message: '`slides` 배열이 필요합니다.' });
      }
      if (BLOB_ENABLED) {
        const saved = await writeSlidesToBlob(parsed.slides);
        return sendJson(res, 200, { message: '저장되었습니다.', ...saved });
      }
      const saved = await writeSlidesToFile(parsed.slides);
      return sendJson(res, 200, {
        message: '저장되었습니다. (로컬 파일 모드)',
        ...saved
      });
    }

    return sendJson(res, 405, { message: 'Method Not Allowed' });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { message: 'JSON 형식이 올바르지 않습니다.' });
    }
    return sendJson(res, 500, { message: error.message || '서버 오류' });
  }
};
