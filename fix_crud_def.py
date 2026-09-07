import os

files = {
    'frontend/src/pages/admin/Unidades.jsx': ('const { unidades: data, setUnidades', 'const { unidades: data, setUnidades, crud'),
    'frontend/src/pages/admin/Operadores.jsx': ('const { operadores: data, setOperadores, unidades, cajas } = useData();', 'const { operadores: data, setOperadores, unidades, cajas, crud } = useData();'),
    'frontend/src/pages/admin/Cajas.jsx': ('const { cajas: data, setCajas } = useData();', 'const { cajas: data, setCajas, crud } = useData();'),
}

for path, (search_str, replace_str) in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(search_str, replace_str)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
