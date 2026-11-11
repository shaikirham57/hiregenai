# HireGen AI backend (Express + Prisma)
FROM node:24-alpine

# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first so Docker can cache this layer.
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client, then compile TypeScript to dist/.
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Apply any pending database migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
