import re

with open('frontend/src/context/DataContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix mappedUnidades
content = content.replace(
    \"anio: u.anio || ''\",
    \"anio: u.anio || '',\n        activo: (u.activo === true || u.activo === 1 || u.activo === '1')\"
)

# Fix mappedCajas
content = content.replace(
    \"placas: c.placas_mx || c.placas || ''\",
    \"placas: c.placas_mx || c.placas || '',\n        activo: (c.activo === true || c.activo === 1 || c.activo === '1')\"
)

# Fix mappedOperadores
content = content.replace(
    \"licencia: o.licencia_mx || o.licencia || '',\",
    \"licencia: o.licencia_mx || o.licencia || '',\n        activo: (o.activo === true || o.activo === 1 || o.activo === '1'),\"
)

# Map dbLocalidades
content = content.replace(
    \"setLocalidades(dbLocalidades);\",
    \"setLocalidades((dbLocalidades || []).map(l => ({ ...l, activo: (l.activo === true || l.activo === 1 || l.activo === '1') })));\"
)

# Map dbClientes
content = content.replace(
    \"setClientes(dbClientes);\",
    \"setClientes((dbClientes || []).map(c => ({ ...c, activo: (c.activo === true || c.activo === 1 || c.activo === '1') })));\"
)


with open('frontend/src/context/DataContext.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
