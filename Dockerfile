# ==========================================
# Multi-stage Frontend Build
# Stage 1: Build static assets with Node.js
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy frontend source code
COPY . .

# Pass build-time environment variable for Vite
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

# Build production distribution
RUN npm run build

# ==========================================
# Stage 2: Serve via high-performance Nginx
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

