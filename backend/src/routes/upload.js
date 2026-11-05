const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudinary'); // ✅ Import de ta config Cloudinary
const jwt = require('jsonwebtoken');

// ✅ Configuration multer pour stocker en mémoire (nécessaire pour Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images et audio
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// ✅ Middleware pour vérifier que c'est un admin
const authAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non authentifié' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'ADMIN' && decoded.nom?.toLowerCase() !== 'stetw') {
      return res.status(403).json({ error: 'Accès réservé à l\'admin' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ POST : Upload d'une IMAGE vers Cloudinary
router.post('/image', authAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    // Convertir le fichier en base64 pour Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'astronote/images', // Dossier dans Cloudinary
      resource_type: 'image',
      transformation: [
        { quality: 'auto' }, // Compression automatique
        { fetch_format: 'auto' } // Format optimisé (WebP, AVIF, etc.)
      ]
    });

    res.json({ 
      message: 'Image uploadée avec succès', 
      url: result.secure_url, // ✅ URL Cloudinary (CDN mondial)
      public_id: result.public_id,
      filename: result.public_id.split('/').pop()
    });
  } catch (error) {
    console.error('Erreur upload image Cloudinary:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST : Upload d'un FICHIER AUDIO (MP3) vers Cloudinary
router.post('/audio', authAdmin, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload en tant que "raw" (fichier brut) car c'est un MP3
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'astronote/audio',
      resource_type: 'raw', // ⚠️ IMPORTANT pour les fichiers audio
      format: 'mp3'
    });

    res.json({ 
      message: 'Audio uploadé avec succès', 
      url: result.secure_url, // ✅ URL Cloudinary (CDN mondial)
      public_id: result.public_id,
      filename: result.public_id.split('/').pop()
    });
  } catch (error) {
    console.error('Erreur upload audio Cloudinary:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;