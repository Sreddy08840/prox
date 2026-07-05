# Stage 1: Build the React bundle
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template

EXPOSE 80

CMD ["sh", "-c", "export RESOLVER_IP=$(grep -i '^nameserver' /etc/resolv.conf | awk '{print $2}' | tr '\n' ' ') && envsubst '${RESOLVER_IP} ${BACKEND_HOST} ${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
