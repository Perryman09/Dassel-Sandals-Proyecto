# ===================================================================
# DASSEL SANDALS - DOCKERFILE MULTI-STAGE
# Combina la interfaz web (React + Vite) y la API Backend (NestJS + Prisma)
# ===================================================================

# -------------------------------------------------------------------
# Stage 1: Compilacion del Frontend y Backend
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Instalar dependencias del root (Frontend)
COPY package*.json ./
RUN npm install

# 2. Instalar dependencias del backend y generar Prisma Client
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm install && npx prisma generate

# 3. Copiar codigo completo
COPY . .

# 4. Compilar Frontend (genera dist/ y copia a backend/client)
RUN npm run build

# 5. Compilar Backend (NestJS)
RUN cd backend && npm run build

# -------------------------------------------------------------------
# Stage 2: Imagen Final Ligera para Produccion (Runner)
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 1. Copiar paquetes del backend e instalar solo dependencias de produccion
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate

# 2. Copiar archivos compilados del backend desde builder
COPY --from=builder /app/backend/dist ./dist

# 3. Copiar archivos estaticos del frontend desde builder
COPY --from=builder /app/backend/client ./client

# 4. Puerto de escucha (Render inyecta su propio $PORT automaticamente)
EXPOSE 3000

# 5. Comando de arranque de la aplicacion
CMD ["node", "dist/main.js"]
