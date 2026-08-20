# CIF MVP — Checklist de Desarrollo
>
> Estado: 🔴 En progreso | 2026-04-07

## FASE 0 — Entorno Local

- [x] Instalar Laragon (PHP 8.2 + MySQL 8.0 incluidos) ✅
- [x] Instalar Composer ✅
- [x] `composer create-project codeigniter4/appstarter api` ✅
- [x] Importar `cif_schema_demo.sql` en phpMyAdmin ✅
- [x] Configurar `api/.env` ✅

## FASE 1 — Base de Datos ✅

- [x] Tabla: usuarios
- [x] Tabla: clientes
- [x] Tabla: operadores
- [x] Tabla: tractocamiones
- [x] Tabla: cajas
- [x] Tabla: viajes
- [x] Tabla: puntos_operador
- [x] Tabla: solicitudes_taller
- [x] Tabla: ordenes_servicio_taller
- [x] Tabla: bitacora_porteria
- [ ] CifDemoSeeder (ejecutar tras instalar CI4)

## FASE 2 — Backend API CodeIgniter 4

- [x] `.env` configurado ✅
- [x] `Config/Routes.php` ✅
- [x] `Config/Filters.php` (alias 'auth') ✅
- [x] `Filters/AuthFilter.php` ✅
- [x] `Controllers/AuthController.php` ✅
- [x] `Controllers/DashboardController.php` ✅
- [x] `Controllers/TractocamionController.php` ✅
- [x] `Controllers/CajaController.php` ✅
- [x] `Controllers/ViajeController.php` ✅ (R1 + R2)
- [x] `Controllers/OperadorController.php` ✅
- [x] `Controllers/TallerController.php` ✅ (SOS)
- [x] `Controllers/PorteriaController.php` ✅
- [x] `Controllers/PuntosController.php` ✅
- [ ] Models (opcional — CI4 Query Builder no requiere modelos separados)

## FASE 3 — Frontend HTML

- [x] `index.html` (login universal) ✅
- [x] `dashboard.html` (Pizarrón Digital — polling 30s) ✅
- [x] `viajes.html` (pipeline visual + modal) ✅
- [x] `flota.html` ✅
- [x] `operadores.html` ✅
- [x] `pwa-operador.html` (móvil con cámara) ✅
- [x] `taller.html` ✅
- [x] `gamificacion.html` ✅
- [x] `assets/css/cif.css` ✅
- [x] `assets/js/api.js` ✅

## FASE 4 — Ajuste Fino & Modernización (Gold Update) 🟠

### Tier 1: Homologación Visual ✅

- [x] Eliminar Sidebar antiguo en todos los módulos.
- [x] Implementar Top Bar unificado (Dashboard, Viajes, Flota, Taller, Operadores).
- [x] Homologar estilos de tablas, tarjetas (matte-grain) y tipografía (Noto Serif/Manrope).
- [x] Modernizar modales en Flota y Operadores.
- [x] Unificar navegación en todas las vistas principales.

### Tier 2: Funcionalidad Taller & Refacciones 🔴

- [ ] Implementar Drawer Lateral en `taller.html` para creación de Órdenes de Servicio.
- [ ] Definir endpoints para gestión de refacciones (`/taller/refacciones`).
- [ ] Implementar visor de historial de mantenimiento por unidad.

### Tier 3: Experiencia de Usuario & Notificaciones ⚪

- [x] Notificaciones en tiempo real para SOS.

## Reglas de Negocio — Implementadas en Backend ✅

- [x] R1: Tracto "en_taller" no puede asignarse → ViajeController::create()
- [x] R2: Foto voucher obligatoria → ViajeController::cambiarEstatus()

---
*Última actualización: 17 de Abril, 2026*
