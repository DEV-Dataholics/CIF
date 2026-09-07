# -*- coding: utf-8 -*-
import sys
with open('frontend/src/pages/Cobranza.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Wrap table in viewMode condition
c = c.replace('<div className="overflow-x-auto">', '{viewMode === "list" ? (\n          <div className="overflow-x-auto">')
c = c.replace('</table>\n        </div>', '</table>\n          </div>\n        ) : (\n          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">\n            {filtered.map(f => (\n              <div key={f.id} className="bg-surface border border-outline-variant/30 p-4 rounded shadow-sm hover:shadow-md transition-shadow relative">\n                <div className="absolute top-4 right-4 flex items-center gap-2">\n                  <input type="checkbox" checked={selectedIds.includes(f.id)} onChange={() => toggleSelection(f.id)} className="mr-2" />\n                </div>\n                <h4 className="font-mono font-bold text-primary text-lg mb-1">{f.folio}</h4>\n                <div className="font-semibold text-sm mb-3">{f.cliente}</div>\n                <div className="text-xl font-bold mb-2">{fmt(f.monto)}</div>\n                <div className="text-xs text-outline mb-4">Emitida: {f.fechaEmision || f.fecha_emision}</div>\n                <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/10">\n                  <span className={adge border  }>\n                    <Clock size={10} /> {f.diasAntiguedad} días\n                  </span>\n                  <div className="flex gap-2">\n                    <button onClick={() => setDetalleFactura(f)} className="text-outline hover:text-primary transition-colors"><Eye size={18} /></button>\n                    <button onClick={() => handleDeleteSingle(f.id)} className="text-outline hover:text-danger transition-colors"><Trash size={18} /></button>\n                    {f.estatus !== "pagada" && <button onClick={() => marcarPagada(f.id)} className="text-[10px] bg-success text-on-success px-2 py-1 rounded hover:brightness-110 uppercase font-bold">Pagar</button>}\n                  </div>\n                </div>\n              </div>\n            ))}\n          </div>\n        )}')

modal_ui = '''
      {detalleFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm p-0 animate-in">
          <div className="bg-surface w-full max-w-md h-full shadow-2xl border-l border-outline-variant/20 flex flex-col slide-in-right">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold">Detalle de Factura</h3>
              <button onClick={() => setDetalleFactura(null)} className="text-outline hover:text-danger transition-colors"><Trash size={0} className="hidden" /> Cerrar</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Folio</div>
                <div className="font-mono text-lg font-bold text-primary">{detalleFactura.folio}</div>
              </div>
              <div>
                <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Cliente</div>
                <div className="font-bold">{detalleFactura.cliente}</div>
              </div>
              <div>
                <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Monto</div>
                <div className="font-mono text-2xl font-bold">{fmt(detalleFactura.monto)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">F. Emisión</div>
                  <div className="text-sm font-mono">{detalleFactura.fechaEmision || detalleFactura.fecha_emision}</div>
                </div>
                <div>
                  <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Antigüedad</div>
                  <div className="text-sm font-bold">{detalleFactura.diasAntiguedad} días</div>
                </div>
              </div>
              <div>
                <div className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Estatus</div>
                <div className="capitalize font-bold">{detalleFactura.estatus}</div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex gap-3">
              {detalleFactura.estatus !== 'pagada' && (
                <button onClick={() => { marcarPagada(detalleFactura.id); setDetalleFactura(null); }} className="flex-1 bg-success text-on-success py-2 rounded font-bold uppercase tracking-widest text-[10px] hover:brightness-110">Marcar como Pagada</button>
              )}
              <button onClick={() => { handleDeleteSingle(detalleFactura.id); setDetalleFactura(null); }} className="flex-1 bg-danger/10 text-danger border border-danger/20 py-2 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-danger/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}
'''

c = c.replace('</div>\n    );\n  }', modal_ui + '\n      </div>\n    );\n  }')

with open('frontend/src/pages/Cobranza.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
