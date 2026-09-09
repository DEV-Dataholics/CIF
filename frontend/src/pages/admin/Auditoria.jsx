import { FileText } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useState, useEffect } from 'react';
import { db } from '../../services/db';

const columns = [
  { key: 'id', label: '#' },
  { key: 'creado_en', label: 'Fecha/Hora', render: (v) => <span className="font-mono text-sm">{v}</span> },
  { key: 'usuario_nombre', label: 'Usuario', render: (v) => <span className="font-semibold text-primary">{v}</span> },
  { key: 'accion', label: 'Acción', render: (v) => {
      let color = 'badge-info';
      if (v === 'CREAR') color = 'badge-success';
      if (v === 'EDITAR') color = 'badge-warning';
      if (v === 'ELIMINAR') color = 'badge-error';
      return <span className={`badge ${color} font-bold`}>{v}</span>;
  }},
  { key: 'entidad', label: 'Módulo', render: (v) => <span className="uppercase text-xs">{v}</span> },
  { key: 'registro_id', label: 'ID Afectado' },
  { key: 'detalles', label: 'Detalles (JSON)', hideInTable: false, render: (v) => <div className="max-w-xs truncate font-mono text-xs opacity-70" title={v}>{v || '-'}</div> },
];

export default function AuditoriaAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAll('logs').then(res => {
      setLogs(res || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <AdminCrud 
      title="Bitácora de Auditoría" 
      subtitle="Registro inmutable de actividades" 
      icon={FileText} 
      columns={columns} 
      data={logs} 
      setData={setLogs} 
      tableName="logs"
      readOnly={true}
      crud={{
        getAll: () => db.getAll('logs'),
        create: null,
        update: null,
        delete: null
      }}
    />
  );
}
