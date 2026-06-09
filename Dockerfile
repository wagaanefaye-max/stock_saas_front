# Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Optionnel : surcharger l'URL API au build (ex. /api pour same-origin via Traefik)
ARG API_URL
RUN if [ -n "$API_URL" ]; then \
      sed -i "s|apiUrl:.*|apiUrl: '${API_URL}',|" src/environments/environment.prod.ts; \
    fi

RUN npm run build

# Servir les fichiers statiques
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/stock-saas/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
