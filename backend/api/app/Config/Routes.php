<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// ── CORS GLOBAL ───────────────────────────────────────────────
// Esto asegura que cualquier petición OPTIONS sea respondida antes de llegar a los controladores
$routes->options('(:any)', static function () {
    $response = service('response');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    return $response
        ->setStatusCode(200)
        ->setHeader('Access-Control-Allow-Origin', $origin)
        ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        ->setHeader('Access-Control-Allow-Credentials', 'true');
});

// ── AUTH ──────────────────────────────────────────────────────
$routes->post('auth/login',  'AuthController::login');
$routes->post('auth/logout', 'AuthController::logout');
$routes->get('auth/me',      'AuthController::me');

// ── RUTAS PROTEGIDAS ──────────────────────────────────────────
$routes->group('', ['filter' => 'auth'], static function ($routes) {
    $routes->get('dashboard/resumen', 'DashboardController::resumen');
    $routes->get('tractocamiones',       'TractocamionController::index');
    $routes->get('tractocamiones/(:num)','TractocamionController::show/$1');
    $routes->post('tractocamiones',      'TractocamionController::create');
    $routes->put('tractocamiones/(:num)','TractocamionController::update/$1');
    $routes->get('cajas',                'CajaController::index');
    $routes->get('cajas/(:num)',         'CajaController::show/$1');
    $routes->post('cajas',               'CajaController::create');
    $routes->put('cajas/(:num)',         'CajaController::update/$1');
    $routes->put('cajas/(:num)/asignar','CajaController::asignar/$1');
    $routes->get('viajes/catalogos',          'ViajeController::catalogos');
    $routes->get('destinos_catalogos',        'ViajeController::destinosCatalogos');
    $routes->get('viajes',                    'ViajeController::index');
    $routes->get('viajes/(:num)',             'ViajeController::show/$1');
    $routes->post('viajes',                   'ViajeController::create');
    $routes->post('viajes/registrar',         'ViajeController::registrarMovimiento');
    $routes->put('viajes/(:num)/estatus',     'ViajeController::cambiarEstatus/$1');
    $routes->post('viajes/(:num)/voucher',    'ViajeController::subirVoucher/$1');
    $routes->get('viajes/facturacion',        'ViajeController::facturacion');
    $routes->put('viajes/(:num)/facturar',    'ViajeController::facturar/$1');
    $routes->get('operadores/mis-viajes',     'OperadorController::misViajes');
    $routes->get('operadores',                'OperadorController::index');
    $routes->get('operadores/(:num)',         'OperadorController::show/$1');
    $routes->post('operadores',               'OperadorController::create');
    $routes->put('operadores/(:num)',         'OperadorController::update/$1');
    $routes->post('taller/sos',               'TallerController::sos');
    $routes->get('taller/solicitudes',        'TallerController::solicitudes');
    $routes->post('taller/solicitudes',       'TallerController::crearSolicitud');
    $routes->put('taller/solicitudes/(:num)', 'TallerController::actualizarSolicitud/$1');
    $routes->get('taller/catalogos',          'TallerController::catalogos');
    $routes->get('taller/ordenes',            'TallerController::ordenes');
    $routes->post('taller/ordenes',           'TallerController::crearOrden');
    $routes->put('taller/ordenes/(:num)',     'TallerController::actualizarOrden/$1');
    $routes->get('taller/checklists',          'TallerController::checklists');
    $routes->post('taller/checklists',         'TallerController::crearChecklist');
    $routes->put('taller/checklists/(:num)',   'TallerController::actualizarChecklist/$1');
    $routes->get('porteria/bitacora',         'PorteriaController::bitacora');
    $routes->post('porteria/bitacora',        'PorteriaController::registrar');
    $routes->get('gamificacion/ranking',        'PuntosController::ranking');
    $routes->get('gamificacion/scorecard/me',   'PuntosController::scorecardMe');
    $routes->get('gamificacion/scorecard/(:num)','PuntosController::scorecard/$1');
    $routes->get('cobranza',                   'CobranzaController::index');
    $routes->post('cobranza',                  'CobranzaController::create');
    $routes->put('cobranza/(:num)/pagar',      'CobranzaController::pagar/$1');

    // Clientes CRUD Routes
    $routes->get('clientes',                   'ClientesController::index');
    $routes->get('clientes/(:num)',            'ClientesController::show/$1');
    $routes->post('clientes',                  'ClientesController::create');
    $routes->put('clientes/(:num)',            'ClientesController::update/$1');
    $routes->delete('clientes/(:num)',         'ClientesController::delete/$1');

    // Tipos de Movimiento Routes
    $routes->get('tiposMovimiento',            'TiposMovimientoController::index');
    $routes->post('tiposMovimiento',           'TiposMovimientoController::create');
    $routes->put('tiposMovimiento/(:num)',     'TiposMovimientoController::update/$1');
    $routes->delete('tiposMovimiento/(:num)',  'TiposMovimientoController::delete/$1');

    // Precios Routes
    $routes->get('precios',            'PreciosController::index');
    $routes->post('precios',           'PreciosController::create');
    $routes->put('precios/(:num)',     'PreciosController::update/$1');
    $routes->delete('precios/(:num)',  'PreciosController::delete/$1');
});
