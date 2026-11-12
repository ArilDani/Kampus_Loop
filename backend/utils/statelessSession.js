const crypto = require('crypto');

const COOKIE_NAME = 'kampusloop.sid';
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getEncryptionKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

function sealPayload(payload, secret) {
  const key = getEncryptionKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

function unsealPayload(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const iv = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');
    if (iv.length !== 12 || tag.length !== 16) return null;

    const key = getEncryptionKey(secret);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isHttpsRequest(req) {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return proto === 'https';
}

function serializeCookie(name, value, options) {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${options.path || '/'}`);
  if (typeof options.maxAge === 'number') {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.httpOnly !== false) {
    segments.push('HttpOnly');
  }
  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }
  if (options.secure) {
    segments.push('Secure');
  }
  return segments.join('; ');
}

function appendSetCookie(res, cookieStr) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieStr);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookieStr]);
  }
}

/**
 * Stateless AES-256-GCM encrypted cookie session middleware compatible with
 * the req.session API used across KampusLoop routes (userId, save, destroy).
 */
function createStatelessSession(options = {}) {
  const maxAgeMs = options.maxAgeMs || DEFAULT_MAX_AGE_MS;
  const cookieName = options.cookieName || COOKIE_NAME;

  function resolveSecret() {
    if (process.env.SESSION_SECRET) {
      return process.env.SESSION_SECRET;
    }
    const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    if (isProd) {
      return null;
    }
    return 'kampusloop-dev-secret';
  }

  return function statelessSessionMiddleware(req, res, next) {
    const secret = resolveSecret();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[cookieName];

    let initialData = {};
    if (secret && token) {
      const unsealed = unsealPayload(token, secret);
      if (unsealed && unsealed.userId) {
        initialData = { userId: unsealed.userId };
      }
    }

    const session = { ...initialData };
    const secureCookie = isHttpsRequest(req);

    Object.defineProperty(session, 'save', {
      enumerable: false,
      value(cb) {
        if (!secret) {
          console.error('SESSION_SECRET environment variable is required in production.');
          if (!res.headersSent) {
            res.status(500).json({ error: 'Konfigurasi keamanan server (SESSION_SECRET) belum diatur.' });
          }
          return;
        }
        const payload = {
          userId: session.userId,
          exp: Date.now() + maxAgeMs,
        };
        const sealed = sealPayload(payload, secret);
        appendSetCookie(
          res,
          serializeCookie(cookieName, sealed, {
            path: '/',
            maxAge: maxAgeMs / 1000,
            httpOnly: true,
            sameSite: 'Lax',
            secure: secureCookie,
          })
        );
        if (typeof cb === 'function') cb(null);
      },
    });

    Object.defineProperty(session, 'destroy', {
      enumerable: false,
      value(cb) {
        delete session.userId;
        appendSetCookie(
          res,
          serializeCookie(cookieName, '', {
            path: '/',
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: secureCookie,
          })
        );
        if (typeof cb === 'function') cb(null);
      },
    });

    req.session = session;
    next();
  };
}

module.exports = createStatelessSession;
