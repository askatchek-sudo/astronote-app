FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances en IGNORANT les packages optionnels spécifiques à une plateforme (comme lightningcss-win32)
RUN npm install --omit=dev --no-optional

# Générer le client Prisma (indispensable)
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Exposer le port
EXPOSE 8080

# Commande pour démarrer le serveur
CMD ["npm", "start"]