const fs = require('fs');
const path = require('path');
const session = require('express-session');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_PATH = path.join(DATA_DIR, 'sessions.json');

class FileSessionStore extends session.Store {
  constructor() {
    super();
    this._sessions = this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(SESSIONS_PATH)) return {};
      const parsed = JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8'));
      const now = Date.now();
      const cleaned = {};
      for (const [sid, entry] of Object.entries(parsed || {})) {
        if (!entry || (entry.expiresAt && entry.expiresAt <= now)) continue;
        cleaned[sid] = entry;
      }
      return cleaned;
    } catch {
      return {};
    }
  }

  _persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SESSIONS_PATH, JSON.stringify(this._sessions), 'utf8');
    } catch (err) {
      console.error('Failed persisting session store:', err);
    }
  }

  _calcExpiresAt(sess) {
    if (sess && sess.cookie && sess.cookie.expires) {
      return new Date(sess.cookie.expires).getTime();
    }
    const maxAge = (sess && sess.cookie && sess.cookie.maxAge) || 1000 * 60 * 60 * 24 * 7;
    return Date.now() + maxAge;
  }

  get(sid, callback) {
    const entry = this._sessions[sid];
    if (!entry) return callback(null, null);
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      delete this._sessions[sid];
      this._persist();
      return callback(null, null);
    }
    return callback(null, entry.session);
  }

  set(sid, sess, callback) {
    this._sessions[sid] = {
      session: sess,
      expiresAt: this._calcExpiresAt(sess),
    };
    this._persist();
    if (callback) callback(null);
  }

  touch(sid, sess, callback) {
    if (this._sessions[sid]) {
      this._sessions[sid] = {
        session: sess,
        expiresAt: this._calcExpiresAt(sess),
      };
      this._persist();
    }
    if (callback) callback(null);
  }

  destroy(sid, callback) {
    if (this._sessions[sid]) {
      delete this._sessions[sid];
      this._persist();
    }
    if (callback) callback(null);
  }
}

module.exports = FileSessionStore;

