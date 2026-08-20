import { useMemo } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useData } from '../../context/DataContext';

export default function Movimientos() {
  const { tiposMovimiento: data, setTiposMovimiento, clientes, crud } = useData();

  const columns = useMemo(() => [
    { key: 'id', label: '#' },
    { key: 'nombre', label: 'Tipo Movimiento', render: (v) => <span className="font-bold">{v}</span> },
    { 
      key: 'clienteAsociado', 
      label: 'Cliente Asociado', 
      formType: 'select',
      options: [
        { value: 'NA', label: 'NA (Uso General)' },
        ...[...new Set(clientes.filter(c => c.activo).map(c => c.razonSocial))]
          .sort()
          .map(razon => ({ value: razon, label: razon }))
      ],
      render: (v) => <span className="text-outline">{v}</span> 
    }
  ], [clientes]);

  return (
    <div className="space-y-6 animate-in">
      <AdminCrud 
        title="Catálogo de Tipos de Movimiento"
        icon={ArrowsLeftRight}
        data={data}
        setData={setTiposMovimiento}
        tableName="tiposMovimiento"
        crud={crud}
        columns={columns}
      />
    </div>
  );
}
