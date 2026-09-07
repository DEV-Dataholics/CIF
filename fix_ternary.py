import sys, re
with open("frontend/src/pages/Cobranza.jsx", "r", encoding="utf-8") as f:
    c = f.read()

card_ui = """
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filtered.map(f => (
              <div key={f.id} className="bg-surface border border-outline-variant/30 p-4 rounded shadow-sm hover:shadow-md transition-shadow relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.includes(f.id)} onChange={() => toggleSelection(f.id)} className="mr-2" />
                </div>
                <h4 className="font-mono font-bold text-primary text-lg mb-1">{f.folio}</h4>
                <div className="font-semibold text-sm mb-3">{f.cliente}</div>
                <div className="text-xl font-bold mb-2">{fmt(f.monto)}</div>
                <div className="text-xs text-outline mb-4">Emitida: {f.fechaEmision || f.fecha_emision}</div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/10">
                  <span className={`badge border ${semaforoBg(f.diasAntiguedad)} ${semaforoColor(f.diasAntiguedad)}`}>
                    <Clock size={10} /> {f.diasAntiguedad} días
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setDetalleFactura(f)} className="text-outline hover:text-primary transition-colors"><Eye size={18} /></button>
                    <button onClick={() => handleDeleteSingle(f.id)} className="text-outline hover:text-danger transition-colors"><Trash size={18} /></button>
                    {f.estatus !== "pagada" && <button onClick={() => marcarPagada(f.id)} className="text-[10px] bg-success text-on-success px-2 py-1 rounded hover:brightness-110 uppercase font-bold">Pagar</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
"""

c = re.sub(r'</table>\s*?</div>\s*?</div>', '</table>\n        </div>' + card_ui + '</div>', c)

with open("frontend/src/pages/Cobranza.jsx", "w", encoding="utf-8") as f:
    f.write(c)
