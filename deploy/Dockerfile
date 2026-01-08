# Standalone Dockerfile - fetches from GitHub
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

ARG GITHUB_REPO=dewiweb/trajectoires-modern
ARG GITHUB_REF=main

RUN git clone --depth 1 --branch ${GITHUB_REF} https://github.com/${GITHUB_REPO}.git .

RUN npm ci

# Build client only
RUN npm run build

# Production - keep tsx for running TypeScript directly
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig*.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

EXPOSE 3000
EXPOSE 9000/udp

ENV NODE_ENV=production

CMD ["npx", "tsx", "server/index.ts"]
