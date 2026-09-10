# syntax=docker/dockerfile:1

FROM node:24-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline

FROM dependencies AS build

# Both values are baked into the static output and cannot be changed afterwards:
# VITE_API_BASE_URL is the backend the panel calls, VITE_BASE_PATH is the URL path it is
# served from.
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_PATH=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
WORKDIR /app
COPY . .
RUN npm run build

# Production image: static files only, served under the same path they were built for, with
# no upstream dependency. The real backend is reached directly from the browser.
FROM nginx:1.29-alpine AS web-prod

ARG VITE_BASE_PATH=/admin/
ENV ADMIN_BASE_PATH=${VITE_BASE_PATH}
COPY docker/nginx.prod.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html${VITE_BASE_PATH}
EXPOSE 80
