#!/usr/bin/env python3
"""Gera o apple-touch-icon: logo real da MMS centralizado sobre o azul do header.

PNG puro (zlib + struct) — sem PIL, sem ferramenta externa, resultado determinístico.
"""
import struct, zlib, pathlib, sys

BG = (0x0C, 0x24, 0x47)   # #0C2447 — azul do header do site
SIZE = 180
LOGO_W = 140              # largura do logo dentro do ícone

src = pathlib.Path(sys.argv[1]); dst = pathlib.Path(sys.argv[2])

# ---- decodifica PNG RGBA8 (colortype 6, sem interlace) ----
d = src.read_bytes()
pos, idat = 8, b''
while pos < len(d):
    ln = struct.unpack('>I', d[pos:pos+4])[0]
    typ = d[pos+4:pos+8]
    if typ == b'IHDR':
        w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', d[pos+8:pos+21])
        assert (bd, ct, il) == (8, 6, 0), f'esperava RGBA8 não-interlaçado, veio {bd}/{ct}/{il}'
    elif typ == b'IDAT':
        idat += d[pos+8:pos+8+ln]
    elif typ == b'IEND':
        break
    pos += 12 + ln

rawdata = zlib.decompress(idat)
stride = w * 4
rows, prev, p = [], bytearray(stride), 0
for _ in range(h):
    f = rawdata[p]; p += 1
    cur = bytearray(rawdata[p:p+stride]); p += stride
    if f == 1:
        for i in range(4, stride): cur[i] = (cur[i] + cur[i-4]) & 255
    elif f == 2:
        for i in range(stride): cur[i] = (cur[i] + prev[i]) & 255
    elif f == 3:
        for i in range(stride):
            a = cur[i-4] if i >= 4 else 0
            cur[i] = (cur[i] + ((a + prev[i]) >> 1)) & 255
    elif f == 4:
        for i in range(stride):
            a = cur[i-4] if i >= 4 else 0
            c = prev[i-4] if i >= 4 else 0
            b = prev[i]
            pp = a + b - c
            pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
            pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
            cur[i] = (cur[i] + pr) & 255
    rows.append(cur); prev = cur

# ---- reduz por média de caixa, em alpha pré-multiplicado ----
lw = LOGO_W
lh = max(1, round(h * lw / w))
small = [[(0, 0, 0, 0)] * lw for _ in range(lh)]
for oy in range(lh):
    y0, y1 = oy * h // lh, max(oy * h // lh + 1, (oy + 1) * h // lh)
    for ox in range(lw):
        x0, x1 = ox * w // lw, max(ox * w // lw + 1, (ox + 1) * w // lw)
        r = g = b = a = n = 0
        for y in range(y0, y1):
            row = rows[y]
            for x in range(x0, x1):
                i = x * 4
                al = row[i+3]
                r += row[i] * al; g += row[i+1] * al; b += row[i+2] * al; a += al; n += 1
        small[oy][ox] = (r/n/255, g/n/255, b/n/255, a/n)

# ---- compõe sobre o fundo e codifica ----
ox0, oy0 = (SIZE - lw) // 2, (SIZE - lh) // 2
out = bytearray()
for y in range(SIZE):
    out.append(0)                      # filtro 0 (None)
    for x in range(SIZE):
        if oy0 <= y < oy0 + lh and ox0 <= x < ox0 + lw:
            pr, pg, pb, al = small[y-oy0][x-ox0]
            k = al / 255.0
            out += bytes((round(pr + BG[0]*(1-k)), round(pg + BG[1]*(1-k)), round(pb + BG[2]*(1-k))))
        else:
            out += bytes(BG)

def chunk(t, data):
    return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data))

png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(bytes(out), 9))
       + chunk(b'IEND', b''))
dst.write_bytes(png)
print(f'{dst} — {SIZE}x{SIZE}, logo {lw}x{lh}, {len(png)} bytes')
