# `src/` — fonte de verdade do site

O `index.html` da raiz é **gerado**. Edite aqui e rode `python3 build.py`.

| Arquivo | O que é | Mexe? |
|---|---|---|
| `component.js` | Lógica da página: estado, navegação, **simulador de empréstimo**, FAQ, links de WhatsApp. É aqui que fica `rate()` e `pmt()`. | ✅ é o arquivo principal |
| `page.html` | Marcação da página inteira (uma SPA de 6 telas, estilos inline). Os `{{ nome }}` são bindings resolvidos pelo `renderVals()` do `component.js`. | ✅ |
| `props.json` | Telefone, 0800, WhatsApp e e-mail. Trocar contato é só aqui. | ✅ |
| `assets/` | Imagens, fontes e o runtime. `assets.json` mapeia UUID → arquivo. | ✅ imagens/fontes |
| `assets/runtime-*.js.gz` | Runtime do framework (`DCLogic`), gzipado. Vendor. | ❌ |
| `loader.js` | Descompacta o manifest e monta a página no browser. Vendor. | ❌ |
| `shell.html` | Esqueleto do arquivo gerado (tela de loading + os `<script>` do bundle). | ⚠️ raramente |
| `ext_resources.json` | Recursos externos do bundler (hoje vazio, `[]`). | ❌ |

## Como funciona o build

`build.py` faz o caminho inverso do bundler original:

1. injeta `component.js` + `props.json` dentro do `page.html`;
2. lê `assets/` e monta o manifest em base64;
3. serializa tudo dentro do `shell.html`.

A serialização é idêntica à do bundler que gerou o arquivo original — a extração foi validada
com `build.py --check` reproduzindo o `index.html` publicado **byte a byte** (1.119.404 bytes).

```bash
python3 build.py           # regera o index.html
python3 build.py --check   # falha se o index.html estiver defasado em relação ao src/
```

O `Dockerfile` roda o `build.py` numa etapa própria, então **o deploy sempre sai do `src/`** —
um `index.html` desatualizado no git não vai parar em produção.

## Onde fica o simulador

`component.js`:

```js
rate() { return this.state.simBenefit === 'INSS' ? 0.0166 : 0.0150; }  // taxa a.m. por convênio
pmt(pv, n) { const i = this.rate(); return pv * i / (1 - Math.pow(1 + i, -n)); }  // Price
```

E o cálculo exibido, dentro de `renderVals()`:

```js
const parcela  = isNovo ? this.pmt(simValor, n) : this.pmt(simSaldo, n);
const total    = parcela * n;
const economia = Math.max(0, simCurParcela - parcela);
```

Limitações conhecidas hoje (Price puro com taxa fixa): não considera IOF, carência do primeiro
vencimento, margem consignável nem coeficiente por banco; o prazo vai a 96 parcelas inclusive
para INSS, cujo teto é 84. As taxas estão fixas no código em vez de virem de tabela.
