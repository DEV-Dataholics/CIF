import { Users } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useState, useEffect } from 'react';
import { db } from '../../services/db';

const columns = [
  { key: 'id', label: '#' },
  { key: 'nombre', label: 'Nombre', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Contraseña (Dejar en blanco para mantener actual)', hideInTable: true, render: () => '***' },
  { key: 'rol', label: 'Rol', formType: 'select', options: ['admin', 'operador', 'visor'], render: (v) => <span className="badge badge-info uppercase">{v}</span> },
    { key: 'activo', label: 'Estatus', formType: 'boolean', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-muted'}`}>{v ? 'Activo' : 'Inactivo'}</span> },
];

export default function UsuariosAdmin() {
  const [usuariosData, setUsuariosData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAll('usuarios').then(res => {
      setUsuariosData((res || []).map(u => ({ ...u, activo: (u.activo === true || u.activo == 1 || u.activo === '1') })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <AdminCrud 
      title="Usuarios" 
      subtitle="Gestión de accesos y credenciales" 
      icon={Users} 
      columns={columns} 
      data={usuariosData} 
      setData={setUsuariosData} 
      tableName="usuarios"
      crud={db}
    />
  );
}
