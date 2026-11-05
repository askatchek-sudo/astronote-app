const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Récupérer le token dans le header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attacher l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
\n});

module.exports = router;