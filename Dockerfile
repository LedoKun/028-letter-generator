FROM --platform=$BUILDPLATFORM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY scripts/build-static.mjs ./scripts/build-static.mjs
COPY tailwind.css vite.config.mjs ./
RUN npm run build

FROM caddy:2-alpine
LABEL org.opencontainers.image.authors="LedoKun <romamp100@gmail.com>"
WORKDIR /app
COPY --from=build /app/dist /app/public
EXPOSE 4000
CMD ["/usr/bin/caddy", "file-server", "--root", "/app/public", "--listen", ":4000", "--access-log"]
