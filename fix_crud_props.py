import os

files = {
    'frontend/src/pages/admin/Unidades.jsx': ('tableName=\"unidades\"', 'setData={setUnidades} crud={crud} tableName=\"unidades\"'),
    'frontend/src/pages/admin/Operadores.jsx': ('tableName=\"operadores\"', 'setData={setOperadores} crud={crud} tableName=\"operadores\"'),
    'frontend/src/pages/admin/Cajas.jsx': ('tableName=\"cajas\"', 'setData={setCajas} crud={crud} tableName=\"cajas\"'),
}

for path, (table, replace_str) in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if table not in content:
        if 'setData={setUnidades}' in content:
            content = content.replace('setData={setUnidades}', replace_str)
        elif 'setData={setOperadores}' in content:
            content = content.replace('setData={setOperadores}', replace_str)
        elif 'setData={setCajas}' in content:
            content = content.replace('setData={setCajas}', replace_str)
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
