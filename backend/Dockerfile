# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for node-gyp or alpine builds
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

# Generate prisma client inside build stage
RUN npx prisma generate

# Remove devDependencies to keep image size small
RUN npm prune --production

# Stage 2: Serve the application
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 5000

# Run prisma migration deploy and start app in production
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
