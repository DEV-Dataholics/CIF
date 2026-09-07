import sys

def inject_delete(filepath, table_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'public function delete' in content:
        return
    
    delete_method = f'''
    public function delete(int $id): \\CodeIgniter\\HTTP\\ResponseInterface
    {{
        try {{
            \\Config\\Database::connect()->table('{table_name}')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        }} catch (\\Exception $e) {{
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar porque esta asignado a otras tablas.'], 409);
        }}
    }}
}}'''
    
    # Replace the last closing brace
    content = content.rstrip()
    if content.endswith('}'):
        content = content[:-1] + delete_method

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

inject_delete('backend/api/app/Controllers/CajaController.php', 'cajas')
inject_delete('backend/api/app/Controllers/OperadorController.php', 'operadores')
inject_delete('backend/api/app/Controllers/CobranzaController.php', 'cobranza')
