<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class CifDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->db = \Config\Database::connect();

        // Limpiar todo antes de reinsertar
        $this->db->query("SET FOREIGN_KEY_CHECKS=0");
        foreach (['puntos_operador','bitacora_porteria','ordenes_servicio_taller',
                  'solicitudes_taller','viajes','operadores','cajas',
                  'tractocamiones','clientes','usuarios'] as $t) {
            $this->db->table($t)->truncate();
        }
        $this->db->query("SET FOREIGN_KEY_CHECKS=1");

        echo "🔄 Poblando base de datos...\n";

        $this->seedUsuarios();
        $this->seedClientes();
        $this->seedTractocamiones();
        $this->seedCajas();
        $this->seedOperadores();
        $this->seedViajes();
        $this->seedTaller();
        $this->seedPorteria();
        $this->seedPuntos();

        echo "✅ CIF Demo Data v2 — Seeded exitosamente!\n";
        echo "   📋 Credenciales: admin@cif.mx / cif2026\n";
    }

    // ──────────────────────────────────────────
    // 1. USUARIOS (Todos los roles)
    // ──────────────────────────────────────────
    private function seedUsuarios(): void
    {
        $pass = password_hash('cif2026', PASSWORD_BCRYPT);
        $usuarios = [
            ['nombre' => 'Luis Ramírez (Admin)',   'email' => 'admin@cif.mx',     'password' => $pass, 'rol' => 'admin',      'activo' => 1],
            ['nombre' => 'Diana Soto (Tráfico)',   'email' => 'trafico@cif.mx',   'password' => $pass, 'rol' => 'trafico',    'activo' => 1],
            ['nombre' => 'Pedro Herrera',          'email' => 'op1@cif.mx',       'password' => $pass, 'rol' => 'operador',   'activo' => 1],
            ['nombre' => 'Juan Carlos Vega',       'email' => 'op2@cif.mx',       'password' => $pass, 'rol' => 'operador',   'activo' => 1],
            ['nombre' => 'Miguel Flores',          'email' => 'op3@cif.mx',       'password' => $pass, 'rol' => 'operador',   'activo' => 1],
            ['nombre' => 'Roberto Salas',          'email' => 'op4@cif.mx',       'password' => $pass, 'rol' => 'operador',   'activo' => 1],
            ['nombre' => 'Ernesto Campos',         'email' => 'op5@cif.mx',       'password' => $pass, 'rol' => 'operador',   'activo' => 1],
            ['nombre' => 'Facturación CIF',        'email' => 'factura@cif.mx',   'password' => $pass, 'rol' => 'facturacion','activo' => 1],
            ['nombre' => 'Taller CIF',             'email' => 'taller@cif.mx',    'password' => $pass, 'rol' => 'taller',     'activo' => 1],
            ['nombre' => 'Portería CIF',           'email' => 'porteria@cif.mx',  'password' => $pass, 'rol' => 'porteria',   'activo' => 1],
            ['nombre' => 'operador demo',          'email' => 'operador@cif.mx',  'password' => $pass, 'rol' => 'operador',   'activo' => 1],
        ];
        foreach ($usuarios as $u) {
            $this->db->table('usuarios')->insert($u);
        }
        echo "  ✔ Usuarios (11)\n";
    }

    // ──────────────────────────────────────────
    // 2. CLIENTES
    // ──────────────────────────────────────────
    private function seedClientes(): void
    {
        $clientes = [
            ['razon_social' => 'Licom S.A. de C.V.',      'tipo' => 'maquiladora', 'precio_cartaporte' => 3500, 'activo' => 1],
            ['razon_social' => 'Foxconn Juárez',           'tipo' => 'maquiladora', 'precio_cartaporte' => 3800, 'activo' => 1],
            ['razon_social' => 'Lear Corporation',         'tipo' => 'maquiladora', 'precio_cartaporte' => 4200, 'activo' => 1],
            ['razon_social' => 'Delphi Technologies',      'tipo' => 'maquiladora', 'precio_cartaporte' => 3900, 'activo' => 1],
            ['razon_social' => 'Grupo Industrial Norteño', 'tipo' => 'comercial',   'precio_cartaporte' => 2800, 'activo' => 1],
        ];
        foreach ($clientes as $c) {
            $this->db->table('clientes')->insert($c);
        }
        echo "  ✔ Clientes (5)\n";
    }

    // ──────────────────────────────────────────
    // 3. TRACTOCAMIONES (10 unidades, estados mixtos)
    // ──────────────────────────────────────────
    private function seedTractocamiones(): void
    {
        $tractos = [
            ['numero_economico' => 'T-001', 'marca' => 'Kenworth', 'modelo' => 'T680', 'anio' => 2021, 'placas_mx' => 'XY1-234-B', 'placas_usa' => 'TX-98232', 'estatus' => 'en_ruta',    'rendimiento_objetivo' => 3.2],
            ['numero_economico' => 'T-002', 'marca' => 'Kenworth', 'modelo' => 'T880', 'anio' => 2022, 'placas_mx' => 'XY2-345-C', 'placas_usa' => 'TX-98233', 'estatus' => 'en_ruta',    'rendimiento_objetivo' => 3.0],
            ['numero_economico' => 'T-003', 'marca' => 'Peterbilt','modelo' => '579',  'anio' => 2020, 'placas_mx' => 'XY3-456-D', 'placas_usa' => 'TX-98234', 'estatus' => 'en_ruta',    'rendimiento_objetivo' => 3.1],
            ['numero_economico' => 'T-004', 'marca' => 'Freightliner', 'modelo' => 'Cascadia', 'anio' => 2021, 'placas_mx' => 'XY4-567-E', 'placas_usa' => null, 'estatus' => 'en_taller', 'rendimiento_objetivo' => 2.9],
            ['numero_economico' => 'T-005', 'marca' => 'Kenworth', 'modelo' => 'T680', 'anio' => 2023, 'placas_mx' => 'XY5-678-F', 'placas_usa' => 'TX-98235', 'estatus' => 'en_taller',  'rendimiento_objetivo' => 3.3],
            ['numero_economico' => 'T-006', 'marca' => 'International', 'modelo' => 'LT', 'anio' => 2022, 'placas_mx' => 'XY6-789-G', 'placas_usa' => null, 'estatus' => 'disponible', 'rendimiento_objetivo' => 3.0],
            ['numero_economico' => 'T-007', 'marca' => 'Kenworth', 'modelo' => 'W900', 'anio' => 2019, 'placas_mx' => 'XY7-890-H', 'placas_usa' => 'TX-98236', 'estatus' => 'disponible', 'rendimiento_objetivo' => 2.8],
            ['numero_economico' => 'T-008', 'marca' => 'Peterbilt','modelo' => '389',  'anio' => 2020, 'placas_mx' => 'XY8-901-I', 'placas_usa' => null, 'estatus' => 'fuera_base',   'rendimiento_objetivo' => 2.7],
            ['numero_economico' => 'T-009', 'marca' => 'Kenworth', 'modelo' => 'T680', 'anio' => 2023, 'placas_mx' => 'XY9-012-J', 'placas_usa' => 'TX-98237', 'estatus' => 'disponible', 'rendimiento_objetivo' => 3.4],
            ['numero_economico' => 'T-010', 'marca' => 'Freightliner', 'modelo' => 'Cascadia', 'anio' => 2021, 'placas_mx' => 'XY0-123-K', 'placas_usa' => 'TX-98238', 'estatus' => 'disponible', 'rendimiento_objetivo' => 3.1],
        ];
        foreach ($tractos as $t) {
            $this->db->table('tractocamiones')->insert($t);
        }
        echo "  ✔ Tractocamiones (10: 3 en ruta, 2 en taller, 4 disponibles, 1 fuera_base)\n";
    }

    // ──────────────────────────────────────────
    // 4. CAJAS (20 con estados variados)
    // ──────────────────────────────────────────
    private function seedCajas(): void
    {
        for ($i = 1; $i <= 20; $i++) {
            $estatus = 'disponible';
            $cliente = null;
            if ($i <= 4) { $estatus = 'en_viaje'; }
            elseif ($i <= 7)  { $estatus = 'en_cliente'; $cliente = ($i % 5) + 1; }
            elseif ($i === 8) { $estatus = 'en_taller'; } // ENUM válido: no existe 'inspeccion'

            $this->db->table('cajas')->insert([
                'numero_caja'        => 'CX-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'tipo'               => ($i % 2 === 0) ? 'local' : 'foranea', // ENUM: local|foranea
                'estatus'            => $estatus,
                'cliente_asignado_id'=> $cliente,
                'placas_mx'          => 'CJ' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'ubicacion_actual'   => $estatus === 'en_viaje' ? 'Puente Zaragoza' : 'Patio CIF',
                'activo'             => 1,
            ]);
        }
        echo "  ✔ Cajas (20: 4 en viaje, 3 en cliente, 1 inspección, 12 disponibles)\n";
    }

    // ──────────────────────────────────────────
    // 5. OPERADORES (vinculados a usuarios)
    // ──────────────────────────────────────────
    private function seedOperadores(): void
    {
        $ops = [
            ['nombre_completo' => 'Pedro Herrera',         'numero_operador' => 'OP-001', 'usuario_id' => 3,  'licencia_mx' => 'LMX-123456', 'licencia_usa' => 'CDL-TX-001', 'activo' => 1, 'tracto_asignado' => 'T-001'],
            ['nombre_completo' => 'Juan Carlos Vega',      'numero_operador' => 'OP-002', 'usuario_id' => 4,  'licencia_mx' => 'LMX-234567', 'licencia_usa' => 'CDL-TX-002', 'activo' => 1, 'tracto_asignado' => 'T-002'],
            ['nombre_completo' => 'Miguel Flores',         'numero_operador' => 'OP-003', 'usuario_id' => 5,  'licencia_mx' => 'LMX-345678', 'licencia_usa' => null,          'activo' => 1, 'tracto_asignado' => 'T-003'],
            ['nombre_completo' => 'Roberto Salas',         'numero_operador' => 'OP-004', 'usuario_id' => 6,  'licencia_mx' => 'LMX-456789', 'licencia_usa' => 'CDL-TX-004', 'activo' => 1, 'tracto_asignado' => 'T-008'],
            ['nombre_completo' => 'Ernesto Campos',        'numero_operador' => 'OP-005', 'usuario_id' => 7,  'licencia_mx' => 'LMX-567890', 'licencia_usa' => 'CDL-TX-005', 'activo' => 1, 'tracto_asignado' => null],
            ['nombre_completo' => 'operador demo',         'numero_operador' => 'OP-006', 'usuario_id' => 11, 'licencia_mx' => 'LMX-678901', 'licencia_usa' => 'CDL-TX-006', 'activo' => 1, 'tracto_asignado' => null],
        ];

        foreach ($ops as $op) {
            $tracto = $op['tracto_asignado'];
            unset($op['tracto_asignado']);
            $opId = $this->db->table('operadores')->insert($op, true);
            if ($tracto) {
                $this->db->table('tractocamiones')
                    ->where('numero_economico', $tracto)
                    ->update(['operador_asignado_id' => $opId]);
            }
        }
        echo "  ✔ Operadores (6, vinculados a tractos)\n";
    }

    // ──────────────────────────────────────────
    // 6. VIAJES (pipeline completo)
    // ──────────────────────────────────────────
    private function seedViajes(): void
    {
        $adminId = 1;
        $viajes = [
            // Viajes activos (visibles en dashboard)
            ['operador_id'=>1,'tractocamion_id'=>1,'caja_id'=>1,'cliente_id'=>1,'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Licom Juárez','estatus'=>'en_transito',  'puntos_asignados'=>0, 'foto_voucher'=>null,      'created_at'=>date('Y-m-d H:i:s', strtotime('-2 hours'))],
            ['operador_id'=>2,'tractocamion_id'=>2,'caja_id'=>2,'cliente_id'=>2,'tipo_movimiento'=>'importacion','origen'=>'El Paso TX','destino'=>'Patio CIF',   'estatus'=>'en_aduana',    'puntos_asignados'=>0, 'foto_voucher'=>null,      'created_at'=>date('Y-m-d H:i:s', strtotime('-5 hours'))],
            ['operador_id'=>3,'tractocamion_id'=>3,'caja_id'=>3,'cliente_id'=>3,'tipo_movimiento'=>'recoleccion','origen'=>'Lear Juárez','destino'=>'Puente Córdova','estatus'=>'asignado',  'puntos_asignados'=>0, 'foto_voucher'=>null,      'created_at'=>date('Y-m-d H:i:s', strtotime('-30 minutes'))],
            ['operador_id'=>4,'tractocamion_id'=>8,'caja_id'=>4,'cliente_id'=>4,'tipo_movimiento'=>'local_cargado','origen'=>'Patio CIF','destino'=>'Delphi El Paso','estatus'=>'en_transito',  'puntos_asignados'=>0, 'foto_voucher'=>null,      'created_at'=>date('Y-m-d H:i:s', strtotime('-3 hours'))],

            // Viajes completados hoy (con voucher) — generan puntos
            ['operador_id'=>1,'tractocamion_id'=>1,'caja_id'=>5,'cliente_id'=>1,'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Licom','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/vouchers/demo_v1.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-8 hours'))],
            ['operador_id'=>2,'tractocamion_id'=>2,'caja_id'=>6,'cliente_id'=>2,'tipo_movimiento'=>'local_vacio', 'origen'=>'El Paso','destino'=>'Patio CIF','estatus'=>'entregado','puntos_asignados'=>1,'foto_voucher'=>'uploads/vouchers/demo_v2.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-10 hours'))],
            ['operador_id'=>3,'tractocamion_id'=>3,'caja_id'=>7,'cliente_id'=>3,'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Lear','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/vouchers/demo_v3.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-12 hours'))],
            ['operador_id'=>5,'tractocamion_id'=>6,'caja_id'=>8,'cliente_id'=>5,'tipo_movimiento'=>'recoleccion','origen'=>'Grupo Norteño','destino'=>'Patio CIF','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/vouchers/demo_v4.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-15 hours'))],

            // Viajes históricos esta semana (para gamificación)
            ['operador_id'=>1,'tractocamion_id'=>1,'caja_id'=>9,'cliente_id'=>1, 'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Licom','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['operador_id'=>1,'tractocamion_id'=>1,'caja_id'=>10,'cliente_id'=>2,'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Foxconn','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-3 days'))],
            ['operador_id'=>2,'tractocamion_id'=>2,'caja_id'=>11,'cliente_id'=>3,'tipo_movimiento'=>'importacion','origen'=>'El Paso','destino'=>'Patio CIF','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-1 day'))],
            ['operador_id'=>2,'tractocamion_id'=>2,'caja_id'=>12,'cliente_id'=>4,'tipo_movimiento'=>'local_vacio','origen'=>'Patio CIF','destino'=>'El Paso','estatus'=>'entregado','puntos_asignados'=>1,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['operador_id'=>3,'tractocamion_id'=>3,'caja_id'=>13,'cliente_id'=>5,'tipo_movimiento'=>'local_cargado','origen'=>'Patio CIF','destino'=>'Grupo Norteño','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['operador_id'=>5,'tractocamion_id'=>6,'caja_id'=>14,'cliente_id'=>1,'tipo_movimiento'=>'exportacion','origen'=>'Patio CIF','destino'=>'Licom','estatus'=>'entregado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-3 days'))],

            // Un viaje en Documentado (listo para facturar)
            ['operador_id'=>4,'tractocamion_id'=>8,'caja_id'=>15,'cliente_id'=>2,'tipo_movimiento'=>'importacion','origen'=>'El Paso TX','destino'=>'Patio CIF','estatus'=>'documentado','puntos_asignados'=>2,'foto_voucher'=>'uploads/v.jpg','created_at'=>date('Y-m-d H:i:s', strtotime('-1 day'))],
        ];

        foreach ($viajes as $v) {
            $v['created_by'] = $adminId;
            $this->db->table('viajes')->insert($v);
        }
        echo "  ✔ Viajes (15: 4 activos, 4 entregados hoy, 6 históricos, 1 para facturar)\n";
    }

    // ──────────────────────────────────────────
    // 7. SOLICITUDES Y ÓRDENES DE TALLER
    // ──────────────────────────────────────────
    private function seedTaller(): void
    {
        // Solicitudes SOS y pendientes
        // ENUM urgencia: baja|media|alta|sos   ENUM estatus: pendiente|en_proceso|resuelto|cancelado
        $solicitudes = [
            ['tractocamion_id'=>4,'operador_id'=>1,'problema'=>'Falla hidráulica en frenos','urgencia'=>'sos',  'estatus'=>'pendiente',  'created_at'=>date('Y-m-d H:i:s', strtotime('-1 day'))],
            ['tractocamion_id'=>5,'operador_id'=>2,'problema'=>'Revisión de motor preventiva','urgencia'=>'media','estatus'=>'en_proceso','created_at'=>date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['tractocamion_id'=>7,'operador_id'=>3,'problema'=>'Cambio de llantas traseras',  'urgencia'=>'baja', 'estatus'=>'pendiente',  'created_at'=>date('Y-m-d H:i:s', strtotime('-3 hours'))],
            ['tractocamion_id'=>6,'operador_id'=>4,'problema'=>'Luz de motor encendida',      'urgencia'=>'alta', 'estatus'=>'pendiente',  'created_at'=>date('Y-m-d H:i:s', strtotime('-45 minutes'))],
        ];
        foreach ($solicitudes as $s) {
            $this->db->table('solicitudes_taller')->insert($s);
        }

        // Órdenes de servicio
        // Columnas reales del schema: tipo (ENUM), descripcion, mecanico_responsable, fecha_inicio, costo_estimado, estatus
        $ordenes = [
            ['tractocamion_id'=>4,'tipo'=>'correctivo',  'descripcion'=>'Corrección de frenos hidráulicos','costo_estimado'=>8500, 'estatus'=>'en_proceso','fecha_inicio'=>date('Y-m-d H:i:s', strtotime('-1 day'))],
            ['tractocamion_id'=>5,'tipo'=>'preventivo',  'descripcion'=>'Servicio mayor 200,000 km',       'costo_estimado'=>12000,'estatus'=>'abierta',   'fecha_inicio'=>date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['tractocamion_id'=>9,'tipo'=>'preventivo',  'descripcion'=>'Servicio menor de aceite y filtros','costo_estimado'=>2800,'estatus'=>'terminada', 'fecha_inicio'=>date('Y-m-d H:i:s', strtotime('-5 days')),'fecha_fin'=>date('Y-m-d H:i:s', strtotime('-4 days'))],
        ];
        foreach ($ordenes as $o) {
            $this->db->table('ordenes_servicio_taller')->insert($o);
        }
        echo "  ✔ Taller (4 solicitudes: 1 SOS, 3 órdenes de servicio)\n";
    }

    // ──────────────────────────────────────────
    // 8. BITÁCORA DE PORTERÍA (entradas/salidas de hoy)
    // ──────────────────────────────────────────
    private function seedPorteria(): void
    {
        // Columnas reales del schema: destino_origen (no 'destino'), sello_caja (no 'sello')
        $registros = [
            ['tractocamion_id'=>1,'operador_id'=>1,'tipo_movimiento'=>'salida', 'destino_origen'=>'Licom Juárez',  'sello_caja'=>'SEL-2024-001','fecha_hora'=>date('Y-m-d H:i:s', strtotime('-2 hours')), 'registrado_por'=>10],
            ['tractocamion_id'=>3,'operador_id'=>3,'tipo_movimiento'=>'salida', 'destino_origen'=>'Lear Corp',     'sello_caja'=>'SEL-2024-002','fecha_hora'=>date('Y-m-d H:i:s', strtotime('-30 minutes')),'registrado_por'=>10],
            ['tractocamion_id'=>7,'operador_id'=>4,'tipo_movimiento'=>'entrada','destino_origen'=>'Patio CIF',     'sello_caja'=>null,          'fecha_hora'=>date('Y-m-d H:i:s', strtotime('-4 hours')), 'registrado_por'=>10],
            ['tractocamion_id'=>9,'operador_id'=>5,'tipo_movimiento'=>'salida', 'destino_origen'=>'El Paso TX',    'sello_caja'=>'SEL-2024-003','fecha_hora'=>date('Y-m-d H:i:s', strtotime('-1 hour')),  'registrado_por'=>10],
            ['tractocamion_id'=>2,'operador_id'=>2,'tipo_movimiento'=>'entrada','destino_origen'=>'Patio CIF',     'sello_caja'=>null,          'fecha_hora'=>date('Y-m-d H:i:s', strtotime('-6 hours')), 'registrado_por'=>10],
        ];
        foreach ($registros as $r) {
            $this->db->table('bitacora_porteria')->insert($r);
        }
        echo "  ✔ Portería (5 registros de hoy: 3 salidas, 2 entradas)\n";
    }

    // ──────────────────────────────────────────
    // 9. PUNTOS DE GAMIFICACIÓN (semana actual)
    // ──────────────────────────────────────────
    private function seedPuntos(): void
    {
        $semana = (int)date('W');
        $anio   = (int)date('Y');

        // Distribución para un ranking con diferencias claras
        $puntos = [
            // Pedro (OP-1): líder de la semana
            ['operador_id'=>1,'viaje_id'=>5, 'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>1,'viaje_id'=>9, 'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>1,'viaje_id'=>10,'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            // Juan Carlos (OP-2): segundo lugar
            ['operador_id'=>2,'viaje_id'=>6, 'puntos_ganados'=>1,'tipo_evento'=>'viaje_vacio',   'semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>2,'viaje_id'=>11,'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>2,'viaje_id'=>12,'puntos_ganados'=>1,'tipo_evento'=>'viaje_vacio',   'semana'=>$semana,'anio'=>$anio],
            // Miguel (OP-3)
            ['operador_id'=>3,'viaje_id'=>7, 'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>3,'viaje_id'=>13,'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            // Ernesto (OP-5)
            ['operador_id'=>5,'viaje_id'=>8, 'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            ['operador_id'=>5,'viaje_id'=>14,'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
            // Roberto (OP-4): menos viajes
            ['operador_id'=>4,'viaje_id'=>15,'puntos_ganados'=>2,'tipo_evento'=>'viaje_cargado','semana'=>$semana,'anio'=>$anio],
        ];

        foreach ($puntos as $p) {
            $this->db->table('puntos_operador')->insert($p);
        }
        echo "  ✔ Gamificación (11 eventos de puntos — ranking: Pedro 6pts, Juan 4pts, Miguel 4pts, Ernesto 4pts, Roberto 2pts)\n";
    }
}
