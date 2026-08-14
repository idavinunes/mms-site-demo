#!/usr/bin/env python3
"""Rasteriza o monograma M do favicon.svg num PNG 32x32 (fallback pro Safari).

Mesma geometria do SVG, preenchida por varredura com supersampling 4x — assim o
PNG e o SVG são o mesmo desenho, sem depender de rasterizador externo.
"""
import struct, zlib, pathlib, sys

BG = (0x0C, 0x24, 0x47)
FG = (0xFF, 0xFF, 0xFF)
SIZE = 32
SS = 4                       # supersampling
# mesmo path do favicon.svg, em viewBox 64
POLY = [(11,46),(11,18),(18.5,18),(32,33.5),(45.5,18),(53,18),(53,46),
        (45,46),(45,29.5),(32,44.5),(19,29.5),(19,46)]

dst = pathlib.Path(sys.argv[1])
N = SIZE * SS
scale = N / 64.0
pts = [(x*scale, y*scale) for x, y in POLY]

cov = [[0]*N for _ in range(N)]
for py in range(N):
    yc = py + 0.5
    xs = []
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i+1) % len(pts)]
        if (y1 <= yc < y2) or (y2 <= yc < y1):
            xs.append(x1 + (yc-y1) * (x2-x1) / (y2-y1))
    xs.sort()
    for i in range(0, len(xs)-1, 2):
        for px in range(max(0, int(xs[i])), min(N, int(xs[i+1])+1)):
            if xs[i] <= px+0.5 < xs[i+1]:
                cov[py][px] = 1

out = bytearray()
for y in range(SIZE):
    out.append(0)
    for x in range(SIZE):
        s = sum(cov[y*SS+dy][x*SS+dx] for dy in range(SS) for dx in range(SS))
        a = s / (SS*SS)
        out += bytes(round(FG[c]*a + BG[c]*(1-a)) for c in range(3))

def chunk(t, data):
    return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data))

dst.write_bytes(b'\x89PNG\r\n\x1a\n'
                + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 2, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(bytes(out), 9))
                + chunk(b'IEND', b''))
print(f'{dst} — {SIZE}x{SIZE}, {dst.stat().st_size} bytes')
