# MMS — Site (demo)

Site institucional da MMS — página única estática (`index.html`, autocontida: estilos/scripts inline, só consome Google Fonts e link de WhatsApp por fora).

## Deploy

Build via **Dockerfile** (nginx alpine servindo o `index.html`). Funciona em qualquer host:

```bash
docker build -t mms-site .
docker run -p 8080:80 mms-site
# abre http://localhost:8080
```

### Ambiente de apresentação

- **Host:** Coolify (`admin.axisnetworks.com.br`), projeto `axisnetworks`
- **URL demo:** https://mms.axisnetworks.com.br
- **Build pack:** Dockerfile

Para levar a outro domínio: basta criar novo app apontando para este repo e ajustar o FQDN + DNS.
