import sys
with open('backend/api/app/Controllers/OperadorController.php', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(\"'El n?mero de operador ya existe.'\", \"'El n?mero de operador ya existe. (Registro Duplicado)'\")
with open('backend/api/app/Controllers/OperadorController.php', 'w', encoding='utf-8') as f:
    f.write(c)
