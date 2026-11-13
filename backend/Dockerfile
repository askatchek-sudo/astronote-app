# Utiliser une image Node.js légère et stable
FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances d'abord (pour optimiser le cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances de production uniquement
RUN npm install --omit=dev

# Générer le client Prisma (indispensable pour que la BDD fonctionne)
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Exposer le port (Fly.io utilise souvent le 8080, mais notre code utilisera process.env.PORT)
EXPOSE 8080

# Commande pour démarrer le serveur
CMD ["npm", "start"]