import { MapPin } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useData } from '../../context/DataContext';

const columns = [
  { key: 'id', label: '#' },
  { key: 'nombre', label: 'Nombre de Localidad', render: (v) => <span className="font-bold">{v}</span> },
  { key: 'tipo', label: 'Tipo', formType: 'select', options: ['planta', 'cedis', 'parque', 'ciudad', 'base', 'taller', 'aduana'], render: (v) => <span className="badge badge-muted uppercase text-[10px]">{v}</span> },
  { key: 'estado', label: 'Estado' },
  { key: 'pais', label: 'País', formType: 'select', options: ['MX', 'US', 'CA'] },
  { key: 'activo', label: 'Estatus', formType: 'boolean', render: (v) => (
    <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>
      {v ? 'Activo' : 'Inactivo'}
    </span>
  )}
];

export default function Localidades() {
  const { localidades: data, setLocalidades, crud } = useData();
  return (
    <div className="space-y-6 animate-in">
      <AdminCrud 
        title="Catálogo de Localidades"
        icon={MapPin}
        data={data}
        setData={setLocalidades}
        tableName="localidades"
        crud={crud}
        columns={columns}
      />
    </div>
  );
}
