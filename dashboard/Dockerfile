# Stage 1: Build the React app
FROM docker.io/library/node:18-alpine AS build

WORKDIR /app

COPY package.json ./
# Use package-lock.json if it exists, otherwise just install from package.json
COPY package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM docker.io/library/nginx:1.23-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
