FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push && npm run start:prod"]
