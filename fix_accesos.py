import sys
with open('frontend/src/pages/Accesos.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('],\\n    );', '],\\n    );\\n\\n  const stats = {\\n    entradas: bitacora.filter(b => b.tipoMov === \\"ENTRADA\\").length,\\n    salidas: bitacora.filter(b => b.tipoMov === \\"SALIDA\\").length\\n  };')
with open('frontend/src/pages/Accesos.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
