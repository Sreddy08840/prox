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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "sed -i \"s/RESOLVER_IP/$(grep -i '^nameserver' /etc/resolv.conf | head -n1 | awk '{print $2}')/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
