const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');

const ROOT_DIR = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Vercel Blob 토큰이 잘못되면 storeId가 비어 URL이 깨져 WebKit/undici가 "The string did not match the expected pattern" 를 던집니다. */
function isLikelyBlobReadWriteToken(token) {
  if (!token || typeof token !== 'string') return false;
  const t = token.trim();
  if (!t.startsWith('vercel_blob_rw_')) return false;
  const parts = t.split('_');
  return parts.length >= 4 && Boolean(parts[3]);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 12_000_000) reject(new Error('요청 본문이 너무 큽니다.'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
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
    'image/svg+xml': '.svg',
    'image/heic': '.heic',
    'image/heif': '.heif'
  };
  return map[mimeType] || '';
}

function extensionFromFilename(name = '') {
  const ext = path.extname(name).toLowerCase();
  if (
    ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.heif', '.bmp'].includes(ext)
  ) {
    return ext;
  }
  return '';
}

function mimeFromExt(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.bmp': 'image/bmp'
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { message: 'Method Not Allowed' });
    }

    const body = await parseRequestBody(req);
    const parsed = JSON.parse(body || '{}');
    const { filename, mimeType: rawMime, contentBase64 } = parsed;
    let mimeType = typeof rawMime === 'string' ? rawMime.trim() : '';
    const extFromName = extensionFromFilename(filename || '');
    if (!(mimeType || '').startsWith('image/')) {
      if (extFromName) {
        mimeType = 'application/octet-stream';
      } else {
        return sendJson(res, 400, { message: '이미지 파일만 업로드할 수 있습니다.' });
      }
    }
    if (!contentBase64 || typeof contentBase64 !== 'string') {
      return sendJson(res, 400, { message: '업로드 데이터가 비어 있습니다.' });
    }
    const approxBytes = Math.floor((contentBase64.length * 3) / 4);
    if (approxBytes > 10 * 1024 * 1024) {
      return sendJson(res, 400, { message: '이미지 용량은 10MB 이하만 가능합니다.' });
    }

    const original = safeFilename(filename || 'upload');
    const originalExt = path.extname(original).toLowerCase();
    const ext =
      originalExt ||
      extFromName ||
      extensionFromMime(mimeType) ||
      '.bin';
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.heif', '.bmp'].includes(ext)) {
      return sendJson(res, 400, { message: '지원하는 이미지 확장자만 업로드할 수 있습니다.' });
    }
    const uploadContentType =
      mimeType === 'application/octet-stream' ? mimeFromExt(ext) : mimeType;
    const baseName = path.basename(original, originalExt || undefined) || 'upload';
    const savedName = `${Date.now()}-${baseName}${ext}`;
    let buffer;
    try {
      buffer = Buffer.from(contentBase64, 'base64');
    } catch {
      return sendJson(res, 400, { message: '이미지 데이터(base64) 형식이 올바르지 않습니다.' });
    }
    if (!buffer.length) {
      return sendJson(res, 400, { message: '이미지 데이터가 비어 있습니다.' });
    }

    if (BLOB_ENABLED) {
      if (!isLikelyBlobReadWriteToken(process.env.BLOB_READ_WRITE_TOKEN)) {
        return sendJson(res, 500, {
          message:
            'Vercel Blob 토큰(BLOB_READ_WRITE_TOKEN)이 올바르지 않습니다. Vercel 대시보드 → Storage → Blob → 프로젝트에 연결된 Read-Write 토큰인지 확인하세요.'
        });
      }
      const blobPath = `hero/${Date.now()}${ext}`;
      const blob = await put(blobPath, buffer, {
        access: 'public',
        contentType: uploadContentType
      });
      return sendJson(res, 200, { url: blob.url });
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const savePath = path.join(UPLOADS_DIR, savedName);
    await fs.writeFile(savePath, buffer);
    return sendJson(res, 200, { url: `/uploads/${savedName}` });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { message: 'JSON 형식이 올바르지 않습니다.' });
    }
    const msg = String(error?.message || '');
    if (msg.includes('did not match the expected pattern')) {
      return sendJson(res, 500, {
        message:
          'Blob 업로드 URL이 올바르지 않습니다. Vercel에서 Blob 스토어를 생성하고 BLOB_READ_WRITE_TOKEN(Read-Write)을 프로젝트 환경 변수에 연결한 뒤 다시 배포하세요.'
      });
    }
    return sendJson(res, 500, { message: error.message || '서버 오류' });
  }
};
