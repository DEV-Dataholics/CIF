import { RoadHorizon } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import data from '../../data/peajes.json';

const columns = [
  { key: 'id', label: '#' },
  { key: 'puente', label: 'Puente', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'tarifa', label: 'Tarifa', render: (v) => <span className="font-mono font-bold text-primary">{v}</span> },
  { key: 'vigencia', label: 'Vigencia', formType: 'date' },
];

export default function Peajes() {
  return <AdminCrud title="Peajes" subtitle="Tarifas de puentes internacionales" icon={RoadHorizon} columns={columns} data={data} />;
}
