import { Package, Warning, CheckCircle } from '@phosphor-icons/react';
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

const renderAlertas = (sct, mec) => {
  const arr = [checkVigencia(sct), checkVigencia(mec)];
  if (arr.includes('rojo')) return <Warning weight="fill" className="text-danger" size={20} title="Documento vencido o crítico" />;
  if (arr.includes('amarillo')) return <Warning weight="fill" className="text-warning" size={20} title="Documento por vencer (60 días)" />;
  if (arr.includes('verde')) return <Warning weight="fill" className="text-success" size={20} title="Documento por vencer (90 días)" />;
  return <CheckCircle weight="fill" className="text-success/50" size={20} title="Todo en orden" />;
};

const columns = [
  { key: 'id', label: '#' },
  { key: 'numeroCaja', label: 'Núm. Caja', render: (v) => <span className="font-mono font-bold">{v}</span> },
  { key: 'tipo', label: 'Tipo' },
  { key: 'placas', label: 'Placas', render: (v) => <span className="font-mono text-outline">{v}</span> },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { 
    key: 'alertas', 
    label: 'Alertas', 
    hideInForm: true,
    render: (_, row) => renderAlertas(row.vigenciaSCT, row.vigenciaMecanico)
  },
  { 
    key: 'estatus', 
    label: 'Estatus', 
    formType: 'select',
    options: ['disponible', 'en_ruta', 'mantenimiento'],
    render: (v) => {
      let color = 'badge-muted';
      if (v === 'disponible') color = 'badge-success';
      if (v === 'en_ruta') color = 'badge-warning';
      if (v === 'mantenimiento') color = 'badge-danger';
      return <span className={`badge ${color} uppercase text-[10px]`}>{v.replace('_', ' ')}</span>
    }
  },
  { key: 'activo', label: 'Activo', formType: 'boolean', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-muted'}`}>{v ? 'Sí' : 'No'}</span> },
  { key: 'vigenciaSCT', label: 'Vigencia SCT', formType: 'date', hideInTable: true },
  { key: 'vigenciaMecanico', label: 'Vigencia Físico/Mecánico', formType: 'date', hideInTable: true }
];

export default function Cajas() {
  const { cajas: data, setCajas } = useData();
  return <AdminCrud title="Cajas (Remolques)" subtitle="Catálogo de remolques y cajas" icon={Package} columns={columns} data={data} setData={setCajas} />;
}
