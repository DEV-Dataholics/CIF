import { SteeringWheel, CheckCircle, Warning } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useData } from '../../context/DataContext';

const checkVigencia = (fecha) => {
  if (!fecha) return null;
  const today = new Date('2026-06-15');
  const diffTime = new Date(fecha).getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) return 'rojo';
  if (diffDays <= 60) return 'amarillo';
  if (diffDays <= 90) return 'verde';
  return 'ok';
};

const renderAlertas = (licencia, visa) => {
  const arr = [checkVigencia(licencia), checkVigencia(visa)];
  if (arr.includes('rojo')) return <Warning weight="fill" className="text-danger" size={20} title="Documento vencido o crítico" />;
  if (arr.includes('amarillo')) return <Warning weight="fill" className="text-warning" size={20} title="Documento por vencer (60 días)" />;
  if (arr.includes('verde')) return <Warning weight="fill" className="text-success" size={20} title="Documento por vencer (90 días)" />;
  return <CheckCircle weight="fill" className="text-success/50" size={20} title="Todo en orden" />;
};

export default function Operadores() {
  const { operadores: data, setOperadores, unidades, cajas, crud } = useData();

  const columns = [
    { key: 'id', label: '#' },
    { key: 'nombreCompleto', label: 'Nombre Completo', render: (v) => <span className="font-bold">{v}</span> },
    { key: 'licencia', label: 'Licencia', render: (v) => <span className="font-mono text-outline">{v}</span> },
    { key: 'visa', label: 'Visa/FAST', render: (v) => <span className="font-mono text-outline">{v}</span> },
    { 
      key: 'alertas', 
      label: 'Alertas', 
      hideInForm: true,
      render: (_, row) => renderAlertas(row.vigenciaLicencia, row.vigenciaVisa)
    },
    { key: 'telefono', label: 'Teléfono' },
    { 
      key: 'tractorAsignado', 
      label: 'Tractor (Defecto)', 
      formType: 'select', 
      options: (unidades || []).map(u => u.numeroEconomico || u.numero_economico),
      render: (v) => <span className="font-mono text-outline">{v || '—'}</span> 
    },
    { 
      key: 'cajaAsignada', 
      label: 'Caja (Defecto)', 
      formType: 'select', 
      options: (cajas || []).map(c => c.numeroCaja || c.numero_caja),
      render: (v) => <span className="font-mono text-outline">{v || '—'}</span> 
    },
    { key: 'activo', label: 'Activo', formType: 'boolean', render: (v) => (
      <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>
        {v ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { key: 'vigenciaLicencia', label: 'Vigencia Licencia', formType: 'date', hideInTable: true },
    { key: 'vigenciaVisa', label: 'Vigencia Visa/FAST', formType: 'date', hideInTable: true }
  ];

  return <AdminCrud title="Catálogo de Operadores" icon={SteeringWheel} columns={columns} data={data} setData={setOperadores} crud={crud} tableName="operadores" />;
}
