# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build client and compile server TypeScript
RUN npm run build && \
    npx tsc -p tsconfig.server.json

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Expose ports
# 3000 = HTTP/WebSocket server
# 9000 = OSC input (UDP)
EXPOSE 3000
EXPOSE 9000/udp

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist-server/server/index.js"]
