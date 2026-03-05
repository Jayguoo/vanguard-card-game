# Server Dockerfile for Render deployment
# Build context should be the repo root (card-game/card-game/), NOT server/
# On Render: Root Directory = card-game/card-game, Docker Context = .

FROM node:20-alpine

WORKDIR /app

# Copy shared directory first (needed for tsc compilation)
COPY shared/ ./shared/

# ---- Build client ----
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

COPY client/ ./
RUN npm run build

# ---- Build server ----
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy server source
COPY server/tsconfig.json ./
COPY server/index.ts ./
COPY server/auth/ ./auth/
COPY server/middleware/ ./middleware/
COPY server/rooms/ ./rooms/
COPY server/game/ ./game/

# Build TypeScript (rootDir=".." resolves ../shared/ to /app/shared/)
RUN npm run build

# Copy client build output to where the server expects it
RUN cp -r /app/client/dist /app/server/dist/client-dist

EXPOSE 3001

CMD ["node", "dist/server/index.js"]
