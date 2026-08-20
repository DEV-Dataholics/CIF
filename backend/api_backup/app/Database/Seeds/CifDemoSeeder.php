<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * CIF — CifDemoSeeder
 * Inserta datos de demostración completos:
 * - 6 usuarios (uno por rol) | password: cif2026
 * - 8 clientes (maquiladoras reales de la frontera)
 * - 10 operadores con licencias MX y USA
 * - 30 tractocamiones con estatus variados
 * - 50 cajas (trailers) locales y foráneas
 * - 50 viajes históricos en distintos estatus
 * - Puntos de gamificación por viaje
 * - 5 solicitudes de taller (SOS incluidos)
 * - 3 órdenes de servicio
 * - 20 entradas en bitácora de portería
 *
 * Ejecutar: php spark db:seed CifDemoSeeder
 */
class CifDemoSeeder extends Seeder
{
    public function run(): void
    {
        $db = \Config\Database::connect();

        // ── 1. USUARIOS ───────────────────────────────────────
        $pass = password_hash('cif2026', PASSWORD_BCRYPT);
        $usuarios = [
            ['nombre'=>'Manuel Andazola',  'email'=>'admin@cif.mx',       'password'=>$pass, 'rol'=>'admin'],
            ['nombre'=>'Adrián Tráfico',   'email'=>'trafico@cif.mx',     'password'=>$pass, 'rol'=>'trafico'],
            ['nombre'=>'Operador Demo',    'email'=>'operador@cif.mx',    'password'=>$pass, 'rol'=>'operador'],
            ['nombre'=>'Cinthya Factura',  'email'=>'facturacion@cif.mx', 'password'=>$pass, 'rol'=>'facturacion'],
            ['nombre'=>'Arnoldo Cano',     'email'=>'taller@cif.mx',      'password'=>$pass, 'rol'=>'taller'],
            ['nombre'=>'Jesús Ricardez',   'email'=>'porteria@cif.mx',    'password'=>$pass, 'rol'=>'porteria'],
        ];
        foreach ($usuarios as $u) {
            if (!$db->table('usuarios')->where('email', $u['email'])->countAllResults()) {
                $db->table('usuarios')->insert($u);
            }
        }

        // ── 2. CLIENTES ───────────────────────────────────────
        $clientes = [
            ['razon_social'=>'Licom S.A. de C.V.',         'tipo'=>'maquiladora', 'tipo_facturacion'=>'ambos',   'precio_cartaporte'=>3500],
            ['razon_social'=>'Foxconn Industrial México',   'tipo'=>'maquiladora', 'tipo_facturacion'=>'ambos',   'precio_cartaporte'=>3800],
            ['razon_social'=>'Biopapel Especialidades',     'tipo'=>'maquiladora', 'tipo_facturacion'=>'nacional','precio_cartaporte'=>2800],
            ['razon_social'=>'Sumitomo Electric Wiring',    'tipo'=>'maquiladora', 'tipo_facturacion'=>'ambos',   'precio_cartaporte'=>4000],
            ['razon_social'=>'DANGIL Manufacturera',        'tipo'=>'maquiladora', 'tipo_facturacion'=>'nacional','precio_cartaporte'=>3200],
            ['razon_social'=>'Lear Corporation Juárez',     'tipo'=>'maquiladora', 'tipo_facturacion'=>'ambos',   'precio_cartaporte'=>3600],
            ['razon_social'=>'Delphi Technologies MX',      'tipo'=>'maquiladora', 'tipo_facturacion'=>'usa',     'precio_cartaporte'=>4200],
            ['razon_social'=>'Honeywell Aerospace Juárez',  'tipo'=>'maquiladora', 'tipo_facturacion'=>'ambos',   'precio_cartaporte'=>4500],
        ];
        foreach ($clientes as $c) {
            if (!$db->table('clientes')->where('razon_social', $c['razon_social'])->countAllResults()) {
                $db->table('clientes')->insert($c);
            }
        }

        // ── 3. OPERADORES ─────────────────────────────────────
        $operadorUserId = $db->table('usuarios')->where('email','operador@cif.mx')->get()->getRowArray()['id'];
        $nombres = [
            'Carlos Rentería','Miguel Ángel Soto','Juan Pérez Jurado',
            'Roberto Escárcega','Héctor Luján','Felipe Terrazas',
            'Armando Quiñones','Gerardo Meléndez','Iván Domínguez','Luis Valdez Ramos'
        ];
        foreach ($nombres as $i => $nombre) {
            $numOp = 'OP-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            if (!$db->table('operadores')->where('numero_operador', $numOp)->countAllResults()) {
                $db->table('operadores')->insert([
                    'nombre_completo'         => $nombre,
                    'numero_operador'         => $numOp,
                    'telefono'                => '614-' . rand(100,999) . '-' . rand(1000,9999),
                    'licencia_mx'             => 'LICMX-' . strtoupper(substr($nombre,0,3)) . rand(1000,9999),
                    'licencia_mx_vencimiento' => date('Y-m-d', strtotime('+' . rand(6,36) . ' months')),
                    'licencia_usa'            => 'CDL-' . rand(100000,999999),
                    'licencia_usa_vencimiento'=> date('Y-m-d', strtotime('+' . rand(6,24) . ' months')),
                    'fecha_ingreso'           => date('Y-m-d', strtotime('-' . rand(1,8) . ' years')),
                    'usuario_id'              => ($i === 0) ? $operadorUserId : null,
                ]);
            }
        }

        // ── 4. TRACTOCAMIONES (30) ────────────────────────────
        $marcas   = ['Kenworth','Freightliner','International','Peterbilt','Volvo'];
        $modelos  = ['T680','Cascadia','LT','579','VNL 760'];
        $estatus  = array_merge(
            array_fill(0, 20, 'disponible'),
            array_fill(0, 6,  'en_ruta'),
            array_fill(0, 4,  'en_taller')
        );
        shuffle($estatus);

        $operadores = $db->table('operadores')->get()->getResultArray();

        for ($i = 1; $i <= 30; $i++) {
            $eco = 'T-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            if (!$db->table('tractocamiones')->where('numero_economico', $eco)->countAllResults()) {
                $marcaIdx = ($i - 1) % count($marcas);
                $op       = $operadores[($i - 1) % count($operadores)] ?? null;
                $db->table('tractocamiones')->insert([
                    'numero_economico'       => $eco,
                    'marca'                  => $marcas[$marcaIdx],
                    'modelo'                 => $modelos[$marcaIdx],
                    'anio'                   => rand(2018, 2024),
                    'placas_mx'              => strtoupper(substr($marcas[$marcaIdx],0,2)) . rand(10,99) . '-' . rand(100,999),
                    'placas_usa'             => rand(100,999) . chr(rand(65,90)) . chr(rand(65,90)) . rand(1000,9999),
                    'permiso_sct'            => 'SCT-' . rand(100000,999999),
                    'vencimiento_sct'        => date('Y-m-d', strtotime('+' . rand(3,24) . ' months')),
                    'poliza_mx'              => 'POL-MX-' . rand(10000,99999),
                    'vencimiento_poliza_mx'  => date('Y-m-d', strtotime('+' . rand(1,18) . ' months')),
                    'poliza_usa'             => 'POL-USA-' . rand(10000,99999),
                    'vencimiento_poliza_usa' => date('Y-m-d', strtotime('+' . rand(1,18) . ' months')),
                    'operador_asignado_id'   => ($estatus[$i-1] !== 'disponible' && $op) ? $op['id'] : null,
                    'estatus'                => $estatus[$i - 1],
                    'rendimiento_objetivo'   => round(rand(30, 40) / 10, 1),
                ]);
            }
        }

        // ── 5. CAJAS (50) ─────────────────────────────────────
        $tiposCaja  = array_merge(array_fill(0,30,'local'), array_fill(0,20,'foranea'));
        $estatusCaja= array_merge(
            array_fill(0,30,'disponible'),
            array_fill(0,10,'en_viaje'),
            array_fill(0,7, 'en_cliente'),
            array_fill(0,3, 'prestada')
        );
        shuffle($tiposCaja);
        shuffle($estatusCaja);
        $clientesAll = $db->table('clientes')->get()->getResultArray();

        for ($i = 1; $i <= 50; $i++) {
            $numCaja = 'CX-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            if (!$db->table('cajas')->where('numero_caja', $numCaja)->countAllResults()) {
                $tipo = $tiposCaja[$i - 1];
                $est  = $estatusCaja[$i - 1];
                $clienteId = ($est === 'en_cliente') ? ($clientesAll[rand(0, count($clientesAll)-1)]['id'] ?? null) : null;
                $db->table('cajas')->insert([
                    'numero_caja'        => $numCaja,
                    'tipo'               => $tipo,
                    'placas_mx'          => 'CX' . rand(10,99) . '-' . rand(100,999),
                    'placas_usa'         => $tipo === 'foranea' ? rand(10,99) . chr(rand(65,90)) . rand(1000,9999) : null,
                    'ubicacion_actual'   => $this->randomUbicacion(),
                    'estatus'            => $est,
                    'cliente_asignado_id'=> $clienteId,
                ]);
            }
        }

        // ── 6. VIAJES (50) ────────────────────────────────────
        $tiposMovimiento = ['local_cargado','local_vacio','exportacion','importacion','rampa','recoleccion','interplanta','reparto'];
        $estatusViaje    = ['solicitado','asignado','en_transito','en_aduana','entregado','documentado','facturado'];
        $tractos = $db->table('tractocamiones')->get()->getResultArray();
        $cajas   = $db->table('cajas')->get()->getResultArray();
        $semana  = (int)date('W');
        $anio    = (int)date('Y');

        for ($i = 1; $i <= 50; $i++) {
            $tracto  = $tractos[($i - 1) % count($tractos)];
            $op      = $operadores[($i - 1) % count($operadores)];
            $caja    = $cajas[($i - 1) % count($cajas)];
            $cliente = $clientesAll[($i - 1) % count($clientesAll)];
            $tipo    = $tiposMovimiento[($i - 1) % count($tiposMovimiento)];
            $est     = $estatusViaje[($i - 1) % count($estatusViaje)];
            $diasAtras = rand(0, 30);

            $puntos = in_array($tipo, ['local_cargado','exportacion','importacion','recoleccion','interplanta']) ? 2 : 1;
            $tieneVoucher = in_array($est, ['entregado','documentado','facturado']);

            $viajeId = $db->table('viajes')->insert([
                'cliente_id'      => $cliente['id'],
                'operador_id'     => $op['id'],
                'tractocamion_id' => $tracto['id'],
                'caja_id'         => $caja['id'],
                'tipo_movimiento' => $tipo,
                'origen'          => $this->randomOrigen(),
                'destino'         => $this->randomDestino(),
                'via_cruce'       => rand(0,1) ? 'Bridge of Americas' : 'Zaragoza-Ysleta',
                'folio_boleta'    => 'BOL-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'fecha_salida'    => date('Y-m-d H:i:s', strtotime("-{$diasAtras} days -" . rand(0,8) . " hours")),
                'fecha_llegada'   => in_array($est,['entregado','documentado','facturado']) ? date('Y-m-d H:i:s', strtotime("-{$diasAtras} days")) : null,
                'estatus'         => $est,
                'foto_voucher'    => $tieneVoucher ? 'uploads/vouchers/demo_' . $i . '.jpg' : null,
                'puntos_asignados'=> $tieneVoucher ? $puntos : 0,
                'created_by'      => 1,
            ], true);

            // Puntos para viajes completados
            if ($tieneVoucher && $viajeId) {
                $db->table('puntos_operador')->insert([
                    'operador_id'   => $op['id'],
                    'viaje_id'      => $viajeId,
                    'puntos_ganados'=> $puntos,
                    'tipo_evento'   => $puntos === 2 ? 'viaje_cargado' : 'viaje_vacio',
                    'semana'        => $semana - ($diasAtras > 6 ? 1 : 0),
                    'anio'          => $anio,
                    'fecha_registro'=> date('Y-m-d H:i:s', strtotime("-{$diasAtras} days")),
                ]);
            }
        }

        // ── 7. SOLICITUDES TALLER ─────────────────────────────
        $tractosTaller = $db->table('tractocamiones')->where('estatus','en_taller')->get()->getResultArray();
        $problemas = [
            'Falla en el motor, humo negro al acelerar',
            'Llanta ponchada trasera derecha, requiero grúa',
            'Frenos traseros con ruido anormal',
            'Aire acondicionado no enfría en ruta',
            'Fuga de aceite severa en el diferencial',
        ];
        $urgencias = ['sos','alta','alta','media','baja'];

        foreach ($problemas as $idx => $prob) {
            $tracto = $tractosTaller[$idx % count($tractosTaller)] ?? $tractos[0];
            $op     = $operadores[$idx % count($operadores)];
            $db->table('solicitudes_taller')->insert([
                'tractocamion_id' => $tracto['id'],
                'operador_id'     => $op['id'],
                'problema'        => $prob,
                'urgencia'        => $urgencias[$idx],
                'puede_operar'    => $urgencias[$idx] !== 'sos' ? 1 : 0,
                'estatus'         => $idx < 2 ? 'en_proceso' : 'pendiente',
            ]);
        }

        // ── 8. ÓRDENES DE SERVICIO ────────────────────────────
        $ordenDescripciones = [
            ['tipo'=>'correctivo', 'desc'=>'Cambio de frenos y balatas traseras','mec'=>'Armando López','costo'=>8500],
            ['tipo'=>'preventivo', 'desc'=>'Servicio de 80,000 km: aceite, filtros y revisión general','mec'=>'Pedro García','costo'=>4200],
            ['tipo'=>'neumaticos', 'desc'=>'Cambio de 4 llantas traseras dobles','mec'=>'Raúl Muñoz','costo'=>18000],
        ];
        $tractoIdx = 0;
        foreach ($ordenDescripciones as $ord) {
            $tracto = $tractosTaller[$tractoIdx % count($tractosTaller)] ?? $tractos[0];
            $db->table('ordenes_servicio_taller')->insert([
                'tractocamion_id'     => $tracto['id'],
                'tipo'                => $ord['tipo'],
                'descripcion'         => $ord['desc'],
                'mecanico_responsable'=> $ord['mec'],
                'fecha_inicio'        => date('Y-m-d H:i:s', strtotime('-' . ($tractoIdx + 1) . ' days')),
                'costo_estimado'      => $ord['costo'],
                'estatus'             => $tractoIdx === 0 ? 'en_proceso' : 'abierta',
            ]);
            $tractoIdx++;
        }

        // ── 9. BITÁCORA PORTERÍA (20 registros) ───────────────
        for ($i = 0; $i < 20; $i++) {
            $tracto  = $tractos[$i % count($tractos)];
            $op      = $operadores[$i % count($operadores)];
            $tipo    = $i % 2 === 0 ? 'salida' : 'entrada';
            $horasAtras = ($i * 2) + rand(0, 1);
            $db->table('bitacora_porteria')->insert([
                'tractocamion_id' => $tracto['id'],
                'caja_id'         => null,
                'operador_id'     => $op['id'],
                'tipo_movimiento' => $tipo,
                'destino_origen'  => $tipo === 'salida' ? $this->randomDestino() : $this->randomOrigen(),
                'sello_caja'      => $i % 3 === 0 ? 'SELLO-' . rand(10000,99999) : null,
                'observaciones'   => null,
                'registrado_por'  => 6, // portería
                'fecha_hora'      => date('Y-m-d H:i:s', strtotime("-{$horasAtras} hours")),
            ]);
        }

        echo "✅ CifDemoSeeder completado:\n";
        echo "   - 6 usuarios (password: cif2026)\n";
        echo "   - 8 clientes\n";
        echo "   - 10 operadores\n";
        echo "   - 30 tractocamiones\n";
        echo "   - 50 cajas\n";
        echo "   - 50 viajes con puntos de gamificación\n";
        echo "   - 5 solicitudes de taller + 3 órdenes\n";
        echo "   - 20 registros en portería\n";
    }

    private function randomOrigen(): string
    {
        $origenes = [
            'Planta Licom - Cd. Juárez','Planta Foxconn - Juárez','Parque Industrial Bermúdez',
            'Parque Industrial Tecnológico','Planta Sumitomo - Juárez','Biopapel El Paso TX',
            'Almacén General Juárez','Planta Lear Juárez','Cruce Zaragoza','Base CIF Juárez',
        ];
        return $origenes[array_rand($origenes)];
    }

    private function randomDestino(): string
    {
        $destinos = [
            'Bridge of Americas - El Paso TX','Cruce Zaragoza-Ysleta','Planta Foxconn Chihuahua',
            'Almacén Walmart El Paso','Planta Delphi Cuauhtémoc','Puerto de Veracruz',
            'Planta Honeywell - El Paso TX','Cliente Cd. Chihuahua','Cruce Lerdo - El Paso',
            'Distribuidora Norte El Paso TX',
        ];
        return $destinos[array_rand($destinos)];
    }

    private function randomUbicacion(): string
    {
        $ubics = [
            'Patio CIF','Planta Licom','Planta Foxconn','Cruce Bridge','Almacén Cliente',
            'En ruta a El Paso','Parque Industrial Bermúdez','Base Chihuahua',
        ];
        return $ubics[array_rand($ubics)];
    }
}
