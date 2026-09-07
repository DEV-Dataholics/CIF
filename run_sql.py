import re

with open('backend/api/app/Controllers/OperadorController.php', 'r', encoding='utf-8') as f:
    content = f.read()

sql_code = '''
    public function fixdb(): \CodeIgniter\HTTP\ResponseInterface
    {
        \ = \Config\Database::connect();
        \ = [
            "ALTER TABLE viajes ADD COLUMN peaje VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN sello VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN salio_origen VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN punto_revision VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN entrada_mx VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN salida_mx VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN entrada_am VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN salida_am VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN hora_entrega VARCHAR(50) NULL",
            "ALTER TABLE viajes ADD COLUMN cmt VARCHAR(100) NULL",
            "ALTER TABLE viajes ADD COLUMN factura VARCHAR(50) NULL"
        ];
        foreach (\ as \) {
            try { \->query(\); } catch (\Exception \) {}
        }
        return \->json(['ok' => true, 'msg' => 'DB patched']);
    }
'''

# Add it before create
content = content.replace('    public function create(): ResponseInterface', sql_code + '\n    public function create(): ResponseInterface')

with open('backend/api/app/Controllers/OperadorController.php', 'w', encoding='utf-8') as f:
    f.write(content)

with open('backend/api/app/Config/Routes.php', 'r', encoding='utf-8') as f:
    routes = f.read()
routes = routes.replace(\"\->get('operadores',                'OperadorController::index');\", \"\->get('operadores',                'OperadorController::index');\n    \->get('fixdb', 'OperadorController::fixdb');\")
with open('backend/api/app/Config/Routes.php', 'w', encoding='utf-8') as f:
    f.write(routes)

