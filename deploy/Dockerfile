# Standalone Dockerfile - fetches from GitHub
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

ARG GITHUB_REPO=dewiweb/trajectoires-modern
ARG GITHUB_REF=main

RUN git clone --depth 1 --branch ${GITHUB_REF} https://github.com/${GITHUB_REPO}.git .

RUN npm ci

RUN npm run build && npx tsc -p tsconfig.server.json

# Production
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 3000
EXPOSE 9000/udp

ENV NODE_ENV=production

CMD ["node", "dist-server/server/index.js"]
