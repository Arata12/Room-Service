# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://server:3001
ARG VITE_USD_TO_MXN_RATE=17.50
ARG VITE_TEST_MODE=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USD_TO_MXN_RATE=$VITE_USD_TO_MXN_RATE
ENV VITE_TEST_MODE=$VITE_TEST_MODE

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
