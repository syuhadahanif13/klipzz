FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

# Jangan hardcode port — backend pakai process.env.PORT di index.ts
# Coolify/Railway/platform lain akan inject PORT lewat env var
EXPOSE ${PORT:-4000}
CMD ["node", "dist/index.js"]
