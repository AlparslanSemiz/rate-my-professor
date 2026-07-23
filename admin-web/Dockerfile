# syntax=docker/dockerfile:1

FROM node:24-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline

FROM dependencies AS api

ENV NODE_ENV=production
WORKDIR /app
COPY scripts ./scripts
CMD ["node", "scripts/mock-api/server.mjs"]

FROM dependencies AS build

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
