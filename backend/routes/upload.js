const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const BUCKET_NAME = 'kampusloop-uploads';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']);
const DOC_MIMES = new Set([
  ...IMAGE_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return true;
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) return false;
  if ((buckets || []).some(b => b.name === BUCKET_NAME)) {
    bucketReady = true;
    return true;
  }
  const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });
  if (!createErr) {
    bucketReady = true;
    return true;
  }
  return false;
}

// POST /api/upload/ — upload product image or seller verification document
router.post('/', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File wajib dipilih untuk diunggah.' });
    }

    const allowedFolders = ['products', 'articles', 'verification', 'templates'];
    const folder = allowedFolders.includes(req.body.folder) ? req.body.folder : 'products';
    const allowed = folder === 'verification' || folder === 'templates' ? DOC_MIMES : IMAGE_MIMES;

    if (!allowed.has(req.file.mimetype)) {
      return res.status(400).json({
        error: folder === 'verification' || folder === 'templates'
          ? 'Format berkas harus berupa gambar (JPG/PNG/WEBP) atau dokumen Word/PDF (.doc/.docx/.pdf).'
          : 'Foto produk harus berupa gambar (JPG, PNG, WEBP, atau GIF).',
      });
    }

    const ext = path.extname(req.file.originalname) || '.bin';
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
    const fileName = `${folder}/${req.session.userId}_${Date.now()}_${uuidv4().slice(0, 8)}${safeExt}`;

    const hasBucket = await ensureBucket();
    if (hasBucket) {
      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (!upErr) {
        const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        if (pub && pub.publicUrl) {
          return res.status(201).json({
            url: pub.publicUrl,
            path: fileName,
            storage: 'supabase',
          });
        }
      }
    }

    if (process.env.VERCEL) {
      return res.status(503).json({
        error: 'Penyimpanan file cloud (Supabase Storage) sedang tidak tersedia. Pastikan bucket kampusloop-uploads aktif.',
      });
    }

    // Local disk fallback served at /uploads (non-serverless development only)
    const localDir = path.join(__dirname, '..', 'uploads', folder);
    fs.mkdirSync(localDir, { recursive: true });
    const localFile = `${req.session.userId}_${Date.now()}_${uuidv4().slice(0, 8)}${safeExt}`;
    fs.writeFileSync(path.join(localDir, localFile), req.file.buffer);

    return res.status(201).json({
      url: `/uploads/${folder}/${localFile}`,
      path: `${folder}/${localFile}`,
      storage: 'local',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengunggah file.' });
  }
});

router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file maksimal 5MB.' });
  }
  next(err);
});

module.exports = router;

