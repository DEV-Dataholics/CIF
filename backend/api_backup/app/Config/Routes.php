<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// ── CORS Preflight OPTIONS ────────────────────────────────────
$routes->options('(:any)', static function () {
    return service('response')
        ->setStatusCode(200)
        ->setHeader('Access-Control-Allow-Origin', $_SERVER['HTTP_ORIGIN'] ?? 'http://127.0.0.1:5500')
        ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With')
        ->setHeader('Access-Control-Allow-Credentials', 'true');
});

// ── AUTH ─────────────────────────────────────────────────────
$routes->post('api/auth/login',  'AuthController::login');
$routes->post('api/auth/logout', 'AuthController::logout');
$routes->get('api/auth/me',      'AuthController::me');

// ── RUTAS PROTEGIDAS (requieren sesión activa) ────────────────
$routes->group('api', ['filter' => 'auth'], static function ($routes) {

    // Dashboard / Pizarrón Digital
    $routes->get('dashboard/resumen', 'DashboardController::resumen');

    // Tractocamiones
    $routes->get('tractocamiones',       'TractocamionController::index');
    $routes->get('tractocamiones/(:num)','TractocamionController::show/$1');
    $routes->post('tractocamiones',      'TractocamionController::create');
    $routes->put('tractocamiones/(:num)','TractocamionController::update/$1');

    // Cajas
    $routes->get('cajas',                'CajaController::index');
    $routes->get('cajas/(:num)',         'CajaController::show/$1');
    $routes->post('cajas',               'CajaController::create');
    $routes->put('cajas/(:num)',         'CajaController::update/$1');
    $routes->put('cajas/(:num)/asignar','CajaController::asignar/$1');

    // Viajes
    $routes->get('viajes/catalogos',          'ViajeController::catalogos');
    $routes->get('viajes',                    'ViajeController::index');
    $routes->get('viajes/(:num)',             'ViajeController::show/$1');
    $routes->post('viajes',                   'ViajeController::create');
    $routes->post('viajes/registrar',         'ViajeController::registrarMovimiento');
    $routes->put('viajes/(:num)/estatus',     'ViajeController::cambiarEstatus/$1');
    $routes->post('viajes/(:num)/voucher',    'ViajeController::subirVoucher/$1');

    // Operadores
    $routes->get('operadores/mis-viajes',     'OperadorController::misViajes');
    $routes->get('operadores',                'OperadorController::index');
    $routes->get('operadores/(:num)',         'OperadorController::show/$1');
    $routes->post('operadores',               'OperadorController::create');
    $routes->put('operadores/(:num)',         'OperadorController::update/$1');

    // Taller
    $routes->post('taller/sos',               'TallerController::sos');
    $routes->get('taller/solicitudes',        'TallerController::solicitudes');
    $routes->post('taller/solicitudes',       'TallerController::crearSolicitud');
    $routes->put('taller/solicitudes/(:num)', 'TallerController::actualizarSolicitud/$1');
    $routes->get('taller/ordenes',            'TallerController::ordenes');
    $routes->post('taller/ordenes',           'TallerController::crearOrden');
    $routes->put('taller/ordenes/(:num)',     'TallerController::actualizarOrden/$1');

    // Portería
    $routes->get('porteria/bitacora',         'PorteriaController::bitacora');
    $routes->post('porteria/bitacora',        'PorteriaController::registrar');

    // Gamificación
    $routes->get('gamificacion/ranking',        'PuntosController::ranking');
    $routes->get('gamificacion/scorecard/me',   'PuntosController::scorecardMe');
    $routes->get('gamificacion/scorecard/(:num)','PuntosController::scorecard/$1');
});
