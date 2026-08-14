#!/usr/bin/env python3
"""Monta o index.html (artefato de deploy) a partir do src/.

    python3 build.py           # gera index.html
    python3 build.py --check   # só confere se o index.html atual bate com o src/

O index.html é gerado — não edite ele à mão. Edite o src/ e rode este script.
Ver src/README.md pra o mapa de cada arquivo.
"""
import base64
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
OUT = ROOT / 'index.html'


def build() -> str:
    shell = (SRC / 'shell.html').read_text(encoding='utf-8')
    page = (SRC / 'page.html').read_text(encoding='utf-8')
    component = (SRC / 'component.js').read_text(encoding='utf-8')
    loader = (SRC / 'loader.js').read_text(encoding='utf-8')
    props = json.loads((SRC / 'props.json').read_text(encoding='utf-8'))
    index = json.loads((SRC / 'assets' / 'assets.json').read_text(encoding='utf-8'))

    # 1) componente + props entram no template
    props_attr = json.dumps(props, ensure_ascii=False, separators=(',', ':')).replace('"', '&quot;')
    template = page.replace('{{PROPS}}', props_attr).replace('{{COMPONENT}}', component)

    # 2) assets viram base64 no manifest, na ordem do assets.json
    manifest = {
        uuid: {
            'mime': meta['mime'],
            'compressed': meta['compressed'],
            'data': base64.b64encode((SRC / 'assets' / meta['file']).read_bytes()).decode('ascii'),
        }
        for uuid, meta in index.items()
    }

    # 3) serialização idêntica à do bundler que gerou o arquivo original
    man_json = '\n' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n  '
    tpl_json = json.dumps(template, ensure_ascii=False).replace('</', '<\\/')
    ext_json = (SRC / 'ext_resources.json').read_text(encoding='utf-8')

    return (shell
            .replace('{{LOADER}}', loader)
            .replace('{{MANIFEST}}', man_json)
            .replace('{{EXT_RESOURCES}}', ext_json)
            .replace('{{TEMPLATE}}', tpl_json))


def main() -> int:
    html = build()
    if '--check' in sys.argv:
        atual = OUT.read_text(encoding='utf-8') if OUT.exists() else ''
        if atual == html:
            print(f'ok — index.html está em dia com o src/ ({len(html):,} bytes)')
            return 0
        print('DIVERGENTE — o index.html não corresponde ao src/. Rode: python3 build.py')
        print(f'  index.html: {len(atual):,} bytes | src/: {len(html):,} bytes')
        return 1
    OUT.write_text(html, encoding='utf-8')
    print(f'index.html gerado — {len(html):,} bytes')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
