import { RoadHorizon } from '@phosphor-icons/react';
import AdminCrud from '../../components/AdminCrud';
import { useData } from '../../context/DataContext';

const columns = [
  { key: 'id', label: '#' },
  { key: 'puente', label: 'Puente', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'tarifa', label: 'Tarifa', render: (v) => <span className="font-mono font-bold text-primary">{v}</span> },
  { key: 'vigencia', label: 'Vigencia', formType: 'date' },
];

export default function Peajes() {
  const { peajes, setPeajes, crud } = useData();
  return <AdminCrud title="Peajes" subtitle="Tarifas de puentes internacionales" icon={RoadHorizon} columns={columns} data={peajes || []} setData={setPeajes} tableName="peajes" crud={crud} />;
}
