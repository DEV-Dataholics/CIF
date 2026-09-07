# -*- coding: utf-8 -*-
import sys
with open('frontend/src/pages/Cobranza.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add view toggle and bulk delete UI
controls_ui = '''
      <div className="flex items-center justify-between mb-4 -mt-2">
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border border-danger/20 transition-colors">
              <Trash size={14} weight="bold" /> Eliminar ({selectedIds.length})
            </button>
          )}
        </div>
        <div className="flex gap-1 border border-outline-variant/30 rounded p-1 bg-surface">
          <button onClick={() => setViewMode('list')} className={\p-1 rounded \\} title="Vista de Lista">
            <List size={16} />
          </button>
          <button onClick={() => setViewMode('cards')} className={\p-1 rounded \\} title="Vista de Tarjetas">
            <SquaresFour size={16} />
          </button>
        </div>
      </div>

      {/* Invoices UI */}
'''
c = c.replace('{/* Invoices table */}', controls_ui)

# Table modifications
# Add checkbox to table header
c = c.replace('<th>Folio</th>', '<th className="w-10 text-center"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th><th>Folio</th>')

# Add checkbox to table row and actions
old_row = '<td className="font-mono font-bold text-primary">{f.folio}</td>'
new_row = '''<td className="text-center">
                      <input type="checkbox" checked={selectedIds.includes(f.id)} onChange={() => toggleSelection(f.id)} />
                    </td>
                    <td className="font-mono font-bold text-primary">{f.folio}</td>'''
c = c.replace(old_row, new_row)

old_actions = "{f.estatus !== 'pagada' && (\n                        <button onClick={() => marcarPagada(f.id)} className=\"text-[10px] font-label font-bold uppercase tracking-widest bg-success text-on-success px-3 py-1.5 rounded hover:brightness-110\">Marcar Pagada</button>\n                      )}"
new_actions = '''<div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetalleFactura(f)} className="text-outline hover:text-primary transition-colors" title="Ver Detalle">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDeleteSingle(f.id)} className="text-outline hover:text-danger transition-colors" title="Eliminar">
                        <Trash size={18} />
                      </button>
                      {f.estatus !== 'pagada' && (
                        <button onClick={() => marcarPagada(f.id)} className="text-[10px] font-label font-bold uppercase tracking-widest bg-success text-on-success px-3 py-1.5 rounded hover:brightness-110">Pagar</button>
                      )}
                    </div>'''
c = c.replace(old_actions, new_actions)

with open('frontend/src/pages/Cobranza.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
