import re

with open('backend/api/app/Controllers/OperadorController.php', 'r', encoding='utf-8') as f:
    content = f.read()

rapido_code = '''
    public function rapido(): \CodeIgniter\HTTP\ResponseInterface
    {
        \ = \->request->getJSON(true);
        \   = \Config\Database::connect();

        if (empty(\['nombre_completo'])) {
            return \->json(['ok' => false, 'error' => 'El nombre es requerido.'], 422);
        }

        \ = trim(\['nombre_completo']);

        // Auto-generate a unique numero_operador from the first letters + timestamp
        \  = preg_split('/\s+/', strtoupper(\));
        \ = implode('', array_map(fn(\) => substr(\, 0, 1), array_slice(\, 0, 3)));
        \   = \ . date('mdHi');
        \ = \;
        \ = 0;
        while (\->table('operadores')->where('numero_operador', \)->countAllResults() > 0) {
            \++;
            \ = \ . \;
        }

        // Create system user for the operator
        \    = strtolower(str_replace(' ', '.', \)) . '@cif.mx';
        \ = password_hash('cif2026', PASSWORD_BCRYPT);

        \->table('usuarios')->insert([
            'nombre'   => \,
            'email'    => \,
            'password' => \,
            'rol'      => 'operador',
            'activo'   => 1,
        ]);
        \ = \->insertID();

        \->table('operadores')->insert([
            'usuario_id'      => \,
            'numero_operador' => \,
            'nombre_completo' => \,
            'licencia_mx'     => 'PENDIENTE',
            'activo'          => 1,
            'fecha_ingreso'   => date('Y-m-d'),
        ]);
        \ = \->insertID();

        return \->json([
            'ok'               => true,
            'id'               => \,
            'numero_operador'  => \,
            'email'            => \,
            'password_inicial' => 'cif2026',
        ], 201);
    }
'''

# insert before public function create
content = content.replace('    public function create(): ResponseInterface', rapido_code + '\n    public function create(): ResponseInterface')

with open('backend/api/app/Controllers/OperadorController.php', 'w', encoding='utf-8') as f:
    f.write(content)
