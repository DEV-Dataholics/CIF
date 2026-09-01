import { MapPin } from "@phosphor-icons/react";
import AdminCrud from "../../components/AdminCrud";
import { useData } from "../../context/DataContext";

const getTipoBadge = (tipo) => {
  if (!tipo) return "badge-muted";
  const t = String(tipo).toLowerCase();
  if (["cliente", "planta", "cedis", "parque"].includes(t)) return "badge-info";
  if (["cruce", "aduana"].includes(t)) return "badge-warning";
  if (["base", "taller"].includes(t)) return "badge-success";
  if (["operacion"].includes(t)) return "badge-orange";
  if (["foraneo"].includes(t)) return "badge-danger";
  return "badge-muted";
};

const columns = [
  { key: "id", label: "#" },
  { key: "nombre", label: "Nombre de Localidad", render: (v) => <span className="font-bold">{v}</span> },
  { key: "tipo", label: "Tipo", formType: "select", options: ["cliente", "cruce", "base", "taller", "operacion", "servicio", "foraneo", "ciudad"], render: (v) => <span className={`badge uppercase text-[10px] ${getTipoBadge(v)}`}>{v}</span> },
  { key: "estado", label: "Estado" },
  { key: "pais", label: "País", formType: "select", options: ["MX", "US", "CA"] },
  { key: "activo", label: "Estatus", formType: "boolean", render: (v) => (
    <span className={`badge ${v ? "badge-success" : "badge-danger"}`}>
      {v ? "Activo" : "Inactivo"}
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

