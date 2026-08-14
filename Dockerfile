# Etapa 1 — monta o index.html a partir do src/ (fonte de verdade)
FROM python:3.12-alpine AS build
WORKDIR /app
COPY build.py ./
COPY src/ ./src/
RUN python3 build.py

# Etapa 2 — nginx servindo a página única
FROM nginx:1.27-alpine

COPY --from=build /app/index.html /usr/share/nginx/html/index.html

# Healthcheck simples para o Coolify/Traefik
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

EXPOSE 80
