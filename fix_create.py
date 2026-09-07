import re

with open('backend/api/app/Controllers/OperadorController.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace users insert
content = content.replace(
    \"\"\"\ = \->table('usuarios')->insert([
            'nombre'   => \['nombre_completo'],
            'email'    => \,
            'password' => \,
            'rol'      => 'operador',
            'activo'   => 1,
        ], true);\"\"\",
    \"\"\"\->table('usuarios')->insert([
            'nombre'   => \['nombre_completo'],
            'email'    => \,
            'password' => \,
            'rol'      => 'operador',
            'activo'   => 1,
        ]);
        \ = \->insertID();\"\"\"
)

# Replace operadores insert
content = content.replace(
    \"\ = \->table('operadores')->insert(\, true);\",
    \"\->table('operadores')->insert(\);\n        \ = \->insertID();\"
)

with open('backend/api/app/Controllers/OperadorController.php', 'w', encoding='utf-8') as f:
    f.write(content)
