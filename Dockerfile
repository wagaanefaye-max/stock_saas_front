# Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL API relative : nginx proxy /api → backend (same-origin, cookies OK)
ARG API_URL=/api
RUN sed -i "s|apiUrl:.*|apiUrl: '${API_URL}',|" src/environments/environment.prod.ts

RUN npm run build

# Servir les fichiers statiques + proxy API
FROM nginx:1.27-alpine

ENV API_UPSTREAM=https://api-sen-stocksaas.com
ENV API_HOST=api-sen-stocksaas.com

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/stock-saas/browser /usr/share/nginx/html

EXPOSE 80
