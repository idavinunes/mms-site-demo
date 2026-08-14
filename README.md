# MMS — Site institucional

Site da MMS Consignados — página única, estática e autocontida (fontes e imagens embutidas;
só consome link de WhatsApp por fora).

**No ar:** https://mmsconsignados.com.br

## Como mexer no site

A fonte de verdade é o **`src/`**. O `index.html` da raiz é **gerado** — não edite ele à mão.

```bash
python3 build.py           # src/ -> index.html
python3 build.py --check   # confere se o index.html está em dia com o src/

python3 -m http.server 8099   # preview em http://127.0.0.1:8099/index.html
```

O que fica onde está em [`src/README.md`](src/README.md). Resumo:

- `src/component.js` — lógica da página, incluindo o **simulador de empréstimo**
- `src/page.html` — a marcação das 6 telas
- `src/props.json` — telefone, 0800, WhatsApp, e-mail
- `src/assets/` — imagens, fontes e o runtime do framework

## Deploy

Build via **Dockerfile**: uma etapa `python:3.12-alpine` roda o `build.py`, e o nginx serve o
resultado. Ou seja, **o deploy sempre sai do `src/`** — um `index.html` desatualizado no git
não chega em produção.

```bash
docker build -t mms-site .
docker run -p 8080:80 mms-site   # http://localhost:8080
```

### Ambiente

- **Host:** Coolify (`admin.axisnetworks.com.br`, servidor `195.182.200.204`), projeto `axisnetworks`
- **App:** `mms-site-demo` (uuid `at070mg0vkfo362eppjpuvsw`), build pack Dockerfile, branch `main`
- **Domínios:** `mmsconsignados.com.br` + `www` (DNS na HostGator) e `mms.axisnetworks.com.br`

## Histórico

O `index.html` nasceu como artefato de uma ferramenta de design (um blob JSON com a página
dentro), sem projeto-fonte. Em 2026-08-14 o componente foi extraído para o `src/` e o `build.py`
passou a remontar o artefato — a extração foi validada reproduzindo o arquivo publicado
**byte a byte**.
