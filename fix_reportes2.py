import sys
with open('frontend/src/pages/reportes/ReportesPrefacturacion.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('{r.tipoMovimiento}', '{r.tipoMovimiento.toUpperCase()}')
c = c.replace('{tipo}', '{(tipo || \"\").toUpperCase()}')

with open('frontend/src/pages/reportes/ReportesPrefacturacion.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
