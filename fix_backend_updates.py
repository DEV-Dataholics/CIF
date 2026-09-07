import sys

def process_file(filepath, mapping_code):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the body of public function update(int $id)
    # We'll use a quick split
    parts = content.split('public function update(int $id): ResponseInterface\n    {')
    if len(parts) < 2:
        parts = content.split('public function update(int $id): \CodeIgniter\HTTP\ResponseInterface\n    {')
    
    if len(parts) >= 2:
        before = parts[0] + 'public function update(int $id): \CodeIgniter\HTTP\ResponseInterface\n    {\n'
        
        # find the end of the method
        end_idx = parts[1].find('\n    }\n')
        if end_idx != -1:
            after = parts[1][end_idx:]
            
            new_content = before + mapping_code + after
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

caja_mapping = """        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['numeroCaja'])) $data['numero_caja'] = $raw['numeroCaja'];
        if (isset($raw['tipo'])) $data['tipo'] = $raw['tipo'];
        if (isset($raw['placas'])) $data['placas_mx'] = $raw['placas'];
        if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        
        if (!empty($data)) {
            $this->db()->table('cajas')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);"""

operador_mapping = """        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['nombreCompleto'])) $data['nombre_completo'] = $raw['nombreCompleto'];
        if (isset($raw['licencia'])) $data['licencia_mx'] = $raw['licencia'];
        if (isset($raw['visa'])) $data['licencia_usa'] = $raw['visa'];
        if (isset($raw['fast'])) $data['licencia_usa'] = $raw['fast'];
        if (isset($raw['telefono'])) $data['telefono'] = $raw['telefono'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        if (isset($raw['vigenciaLicencia'])) $data['licencia_mx_vencimiento'] = $raw['vigenciaLicencia'];
        if (isset($raw['vigenciaVisa'])) $data['licencia_usa_vencimiento'] = $raw['vigenciaVisa'];
        
        if (!empty($data)) {
            $this->db()->table('operadores')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);"""

tracto_mapping = """        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['numeroEconomico'])) $data['numero_economico'] = $raw['numeroEconomico'];
        if (isset($raw['placas'])) $data['placas_mx'] = $raw['placas'];
        if (isset($raw['marca'])) $data['marca'] = $raw['marca'];
        if (isset($raw['modelo'])) $data['modelo'] = $raw['modelo'];
        if (isset($raw['anio'])) $data['anio'] = $raw['anio'];
        if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        if (isset($raw['vigenciaSCT'])) $data['vencimiento_sct'] = $raw['vigenciaSCT'];
        if (isset($raw['vigenciaSeguro'])) $data['vencimiento_poliza_mx'] = $raw['vigenciaSeguro'];
        
        if (!empty($data)) {
            \Config\Database::connect()->table('tractocamiones')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);"""

process_file('backend/api/app/Controllers/CajaController.php', caja_mapping)
process_file('backend/api/app/Controllers/OperadorController.php', operador_mapping)
process_file('backend/api/app/Controllers/TractocamionController.php', tracto_mapping)
