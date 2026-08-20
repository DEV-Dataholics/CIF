import { Users } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useData } from '../../context/DataContext';

const columns = [
  { key: 'id', label: '#' },
  { key: 'razonSocial', label: 'Razón Social', render: (v) => <span className="font-bold">{v}</span> },
  { key: 'activo', label: 'Estatus', formType: 'boolean', render: (v) => (
    <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>
      {v ? 'Activo' : 'Inactivo'}
    </span>
  )}
];

export default function Clientes() {
  const { clientes: data, setClientes, crud } = useData();
  return (
    <div className="space-y-6 animate-in">
      <AdminCrud 
        title="Catálogo de Clientes"
        icon={Users}
        data={data}
        setData={setClientes}
        tableName="clientes"
        crud={crud}
        columns={columns}
      />
    </div>
  );
}
