# Utiliser node:20-slim (beaucoup plus compatible avec Prisma que alpine)
FROM node:20-slim

WORKDIR /app

# Installer OpenSSL (requis par le moteur Prisma pour les connexions SSL sécurisées)
RUN apt-get update && apt-get install -y openssl

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm install

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Exposer le port
EXPOSE 8080

# Commande pour démarrer le serveur
CMD ["npm", "start"]