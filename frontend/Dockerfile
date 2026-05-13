FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_APP_NAME="H MED DISTRIBUIDORA"

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# Produção com Nginx
# ==========================================
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx para SPA (React Router)
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compressão gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - redirecionar tudo para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
