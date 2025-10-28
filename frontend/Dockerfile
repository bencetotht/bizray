# Builder stage
FROM node:24-bullseye AS builder
# Install devDependencies to run Vite build
ENV NODE_ENV=development
WORKDIR /app
COPY ./package.json ./
# Intentionally do NOT copy package-lock.json to avoid npm optional-deps bug with Rollup on Linux
# Install deps including dev so Vite build works
RUN npm install --include=dev
COPY . .
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV ROLLUP_SKIP_NODEJS_NATIVE=true
RUN npm run build

# Production stage
FROM nginx:1.29.2-alpine AS production
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist .
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]