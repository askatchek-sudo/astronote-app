const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le dossier en fonction du type de fichier
    if (file.mimetype.startsWith('audio/')) {
      cb(null, path.join(__dirname, '../../uploads/audio'));
    } else {
      cb(null, path.join(__dirname, '../../uploads/images'));
    }
  },
  filename: (req, file, cb) => {
    // Nom unique pour éviter les conflits
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedAudio = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
  const allowedImage = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedAudio.includes(file.mimetype) || allowedImage.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite à 50 Mo
});

module.exports = upload;