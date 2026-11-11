# HireGen AI frontend (React + Vite), served by nginx.
# Build from the repository root so the root package.json is available:
#   docker build -f frontend/Dockerfile .

# 1) Build the static website
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts skips the Prisma install hook, which the website doesn't need.
RUN npm ci --ignore-scripts

COPY frontend ./frontend
# The website calls the API on the same address; nginx forwards /api to the backend.
ENV VITE_API_URL=/api
RUN npx vite build frontend

# 2) Serve it with nginx
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
