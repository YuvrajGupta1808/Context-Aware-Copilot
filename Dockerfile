# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Install serve for frontend
RUN npm install -g serve

EXPOSE 3000 8080 8081

# Start both services
CMD sh -c "cd /app/backend && node server.js & serve -s /app/frontend/dist -l 3000"
