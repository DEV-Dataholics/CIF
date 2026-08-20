import { useState, useMemo } from 'react';
import { CaretUp, CaretDown, MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function DataTable({ columns, data, visibleColumns, pageSize = 15, onRowClick }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const actualVisibleColumns = visibleColumns || columns.map(c => c.key);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      actualVisibleColumns.some(key => {
        const val = row[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, actualVisibleColumns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const activeCols = columns.filter(c => actualVisibleColumns.includes(c.key));

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 matte-grain print:bg-white print:border-none print:shadow-none">
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center gap-3 print:hidden">
        <MagnifyingGlass size={16} className="text-outline" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Buscar en tabla..."
          className="flex-1 bg-transparent text-sm font-body text-on-surface placeholder:text-outline/50 outline-none"
        />
        <span className="font-label text-[9px] uppercase tracking-widest text-outline">
          {sorted.length} registros
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="cif-table">
          <thead>
            <tr>
              {activeCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none hover:text-primary transition-colors print:text-black print:border-black"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <CaretUp size={10} /> : <CaretDown size={10} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="print:hidden">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length} className="text-center py-16 text-outline font-label uppercase tracking-widest opacity-50">
                  Sin resultados
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {activeCols.map(col => (
                    <td key={col.key} className="whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tbody className="hidden print:table-row-group">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length} className="text-center py-16 text-outline font-label uppercase tracking-widest opacity-50">
                  Sin resultados
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={row.id || i}>
                  {activeCols.map(col => (
                    <td key={col.key} className="whitespace-nowrap text-xs py-1 border-b border-outline-variant/20 print:text-black">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-outline-variant/20 flex items-center justify-between print:hidden">
          <span className="font-label text-[9px] uppercase tracking-widest text-outline">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all disabled:opacity-30"
            >
              <CaretLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all disabled:opacity-30"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
