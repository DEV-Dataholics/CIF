import sys
with open('frontend/src/pages/reportes/ReportesPrefacturacion.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Excel export
c = c.replace('wsData.push([r.tipoMovimiento, r.cantidad, r.precioUnitario, r.totalUSD, r.totalUSD * tipoCambio]);',
              'wsData.push([r.tipoMovimiento.toUpperCase(), r.cantidad, r.precioUnitario, r.totalUSD, r.totalUSD * tipoCambio]);')

# Fix UI table for abstract (Dark mode)
c = c.replace('<td className=\"py-3 px-4 font-bold\">{r.tipoMovimiento}</td>',
              '<td className=\"py-3 px-4 font-bold uppercase\">{r.tipoMovimiento}</td>')

# Fix UI table for abstract (Light mode / print)
c = c.replace('<td className=\"py-2.5 px-4 font-bold text-slate-900\">{r.tipoMovimiento}</td>',
              '<td className=\"py-2.5 px-4 font-bold text-slate-900 uppercase\">{r.tipoMovimiento}</td>')

# Fix group header in UI/PDF (which renders the title of the movement type)
c = c.replace('<div className=\"bg-primary text-on-primary py-1.5 px-3 font-bold font-headline text-lg\">{tipo}</div>',
              '<div className=\"bg-primary text-on-primary py-1.5 px-3 font-bold font-headline text-lg uppercase\">{tipo}</div>')

with open('frontend/src/pages/reportes/ReportesPrefacturacion.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
