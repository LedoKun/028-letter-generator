FROM caddy:2-alpine

WORKDIR /app
COPY public /app/public

EXPOSE 4000

CMD ["/usr/bin/caddy", "file-server", "--root", "/app/public", "--listen", ":4000", "--access-log"]