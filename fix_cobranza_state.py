import sys, re
with open('frontend/src/pages/Cobranza.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update imports
c = c.replace('import { CurrencyCircleDollar, CheckCircle, WarningCircle, Clock, Receipt, Download, FilePdf, MagnifyingGlass } from \\'@phosphor-icons/react\\';', 
              'import { CurrencyCircleDollar, CheckCircle, WarningCircle, Clock, Receipt, Download, FilePdf, MagnifyingGlass, Trash, List, SquaresFour, Eye } from \\'@phosphor-icons/react\\';')

# Update useData extraction
c = c.replace('const { facturas, addFacturaYCliente, updateFacturaEstatus } = useData();',
              'const { facturas, addFacturaYCliente, updateFacturaEstatus, crud, refreshData } = useData();')

# Add new states and functions
new_state = '''
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [detalleFactura, setDetalleFactura] = useState(null);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(¿Estás seguro de eliminar las  facturas seleccionadas?)) {
      try {
        for (let id of selectedIds) {
          await crud.remove('facturas', id);
        }
        await refreshData();
        setSelectedIds([]);
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

  const handleDeleteSingle = async (id) => {
    if (window.confirm('¿Eliminar esta factura?')) {
      try {
        await crud.remove('facturas', id);
        await refreshData();
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };
'''
c = c.replace('const [clienteSeleccionado, setClienteSeleccionado] = useState(\\'todos\\');', 
              'const [clienteSeleccionado, setClienteSeleccionado] = useState(\\'todos\\');\\n' + new_state)

with open('frontend/src/pages/Cobranza.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
