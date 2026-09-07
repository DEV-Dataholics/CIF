import re

with open('backend/api/app/Config/Routes.php', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    \"\->post('viajes',                   'ViajeController::create');\",
    \"\->post('viajes',                   'ViajeController::create');\n    \->put('viajes/(:num)',            'ViajeController::update/\');\n    \->delete('viajes/(:num)',         'ViajeController::delete/\');\"
)

with open('backend/api/app/Config/Routes.php', 'w', encoding='utf-8') as f:
    f.write(content)

with open('backend/api/app/Controllers/ViajeController.php', 'r', encoding='utf-8') as f:
    content = f.read()

update_code = '''
    public function update(int \): \CodeIgniter\HTTP\ResponseInterface
    {
        \ = \->request->getJSON(true);
        \   = \->db();
        
        \ = \->table('viajes')->where('id', \)->get()->getRowArray();
        if (!\) {
            return \->json(['ok' => false, 'error' => 'Viaje no encontrado.'], 404);
        }

        // Filtramos columnas validas de la tabla viajes
        \ = ['operador_id', 'tractocamion_id', 'caja_id', 'cliente_id', 'tipo_movimiento', 'origen', 'destino', 'estatus', 'notas', 'folio_boleta', 'peaje', 'sello', 'salio_origen', 'punto_revision', 'entrada_mx', 'salida_mx', 'entrada_am', 'salida_am', 'hora_entrega', 'cmt', 'factura', 'fecha', 'hora'];
        
        \ = [];
        foreach (\ as \) {
            if (array_key_exists(\, \)) {
                \[\] = \[\];
            }
        }

        if (empty(\)) {
            return \->json(['ok' => true]);
        }

        \->table('viajes')->where('id', \)->update(\);
        return \->json(['ok' => true]);
    }

    public function delete(int \): \CodeIgniter\HTTP\ResponseInterface
    {
        \->db()->table('viajes')->where('id', \)->delete();
        return \->json(['ok' => true]);
    }
'''

content = content.replace('    public function cambiarEstatus(int ): ResponseInterface', update_code + '\n    public function cambiarEstatus(int ): ResponseInterface')

with open('backend/api/app/Controllers/ViajeController.php', 'w', encoding='utf-8') as f:
    f.write(content)
