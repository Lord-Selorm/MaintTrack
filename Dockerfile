# MaintTrack — single-container build for Render (and any Docker host)
# The image ships the whole repository: backend API + static frontend.

FROM node:18-alpine

WORKDIR /app

# Install backend dependencies first for better layer caching
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci --omit=dev

# Copy the full app (frontend/ is served statically by the backend)
COPY backend/src backend/src
COPY frontend frontend

ENV NODE_ENV=production
ENV PORT=10000

WORKDIR /app/backend

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:10000/api/health-check || exit 1

CMD ["npm", "start"]