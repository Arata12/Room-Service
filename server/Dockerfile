FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

FROM base AS deps
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S nodejs && adduser -S node -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3001
CMD ["npm", "start"]
