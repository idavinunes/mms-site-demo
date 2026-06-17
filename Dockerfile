FROM nginx:1.27-alpine

# Site estático MMS — página única autocontida (index.html)
COPY index.html /usr/share/nginx/html/index.html

# Healthcheck simples para o Coolify/Traefik
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

EXPOSE 80
