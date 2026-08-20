import { Users } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import data from '../../data/usuarios.json';

const columns = [
  { key: 'id', label: '#' },
  { key: 'nombre', label: 'Nombre', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol', formType: 'select', options: ['admin', 'operador', 'visor'], render: (v) => <span className="badge badge-info">{v}</span> },
  { key: 'permiso', label: 'Permiso', formType: 'select', options: [1, 2, 3], render: (v) => <span className="font-mono font-bold text-primary">{v}</span> },
  { key: 'activo', label: 'Estatus', formType: 'boolean', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-muted'}`}>{v ? 'Activo' : 'Inactivo'}</span> },
];

import { useState } from 'react';

export default function UsuariosAdmin() {
  const [usuariosData, setUsuariosData] = useState(data);
  return <AdminCrud title="Usuarios" subtitle="Gestión de accesos y permisos" icon={Users} columns={columns} data={usuariosData} setData={setUsuariosData} />;
}
