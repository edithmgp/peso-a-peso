FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Arranca Vite pasándole el flag --host para que acepte conexiones externas a Docker
CMD ["npm", "run", "dev", "--", "--host"]
