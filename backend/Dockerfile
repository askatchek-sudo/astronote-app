FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (y compris prisma CLI, nécessaire pour "generate")
RUN npm install

# Générer le client Prisma avec la version 5.x locale (compatible avec ton schema)
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Exposer le port
EXPOSE 8080

# Commande pour démarrer le serveur
CMD ["npm", "start"]