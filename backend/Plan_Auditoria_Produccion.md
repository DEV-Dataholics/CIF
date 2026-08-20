# Plan de Auditoría y Roadmap: Demo → Producción
## CIF Gestión Logística MVP

Tras analizar el código fuente de los módulos frontend y backend actuales, he detectado diversas áreas de oportunidad que explican las inconsistencias que mencionas (datos desconectados, botones sin función, modales vacíos).

Este documento sirve como auditoría del estado actual y hoja de ruta para alcanzar el nivel de producción.

---

## 1. Auditoría del Estado Actual

### 🔴 Bugs Críticos — Backend (Bloquean flujo real)
1. **Falta de métricas en Dashboard:** El `DashboardController` no está devolviendo la información completa sobre `tractos_taller`, `sos_pendientes` ni `solicitudes_taller_pendientes`, enviando valores nulos al frontend.
2. **Costo de inactividad estático:** El `DashboardController` no calcula el `costo_inactividad`, dejándolo siempre en 0.
3. **Desincronización de Estatus de Cajas:** `ViajeController::create()` no actualiza el estatus de la caja a `en_viaje` al ser asignada a un movimiento.
4. **Campo inexistente en Seeder:** El `CifDemoSeeder` intenta insertar un campo `tracto_asignado` en la tabla `operadores`, pero dicho campo no existe en el origen,  pertence a la tabla `tractocamiones` (`operador_asignado_id`).
5. **Métodos faltantes en Taller:** `TallerController` define rutas para crear solicitudes y órdenes, pero los métodos `crearSolicitud()` y `crearOrden()` no existen, provocando un error 500.

### 🟡 Defectos de UX — Frontend (Experiencia no profesional)
1. **Modales Nativos (Alert/Confirm):** Se usan visualizaciones rudimentarias (`alert` para detalles de viaje, `confirm` para cambio de estatus) en `viajes.html`.
2. **Modales Vacíos:** Las funciones `verDetalleTracto()` y `verDetalleCaja()` en la vista de Flota solo muestran un texto provisional (placeholder).
3. **Falta de consistencia de sesión:** El sidebar no muestra quién está logueado en las vistas fuera del Dashboard, y carecen del botón "Cerrar sesión".
4. **Funciones JS no definidas:** `viajes.html` y `dashboard.html` intentan usar `badgeViaje()` y `fmtFecha()` que aún no están construidas globalmente en `api.js`.
5. **Datos fijos en UI:** En la pantalla `operadores.html`, los campos referentes a licencias (MX, USA) no existen en el schema de BD y se muestran campos que no están relacionados a la API real.

### 🔵 Integridad de Datos
1. **Desincronización Tracto-Operador:** No existe un vínculo bidireccional puro. El tractocamión sabe quién es su operador, pero el módulo de operadores asume un campo en la tabla independiente que dificulta mostrar qué tracto manejan.
2. **Campos incompletos:** Las tablas del taller necesitan una columna `created_at` o `fecha_inicio` para registrar el momento real de ingreso al taller.

---

## 2. Roadmap hacia Producción

Las tareas se dividirán en 4 fases progresivas para solucionar primero lo crítico y avanzar hacia requerimientos avanzados.

### FASE 1 — Correcciones Críticas (Base Funcional)
> Objetivo: Que la información fluya correctamente entre BD, lógica de negocio y frontend sin errores técnicos.

- [ ] **F1.1 Core JS:** Actualizar `api.js` con las funciones compartidas faltantes (`badgeViaje`, `fmtFecha`, `getCurrentUser`, `logout`).
- [ ] **F1.2 Dashboard API:** Modificar `DashboardController` para retornar arreglos reales de Taller, SOS, calcular el costo de inactividad ($1,500/día en taller) y unificar métricas.
- [ ] **F1.3 Mantenimiento:** Construir los métodos faltantes `crearSolicitud()` y `crearOrden()` en `TallerController`.
- [ ] **F1.4 Ciclo de Vida de Caja:** Ajustar `ViajeController` para cambiar la caja a `en_viaje` al inicio y a `disponible` al completar el viaje.
- [ ] **F1.5 Modelado de Datos:** Asegurar que los endpoints recuperen la relación correcta entre operadores y tractocamiones (JOINs correctos).

### FASE 2 — Modernización de Interfaz (UX UI)
> Objetivo: Reemplazar modales básicos por componentes formales y unificar la experiencia de usuario.

- [ ] **F2.1 Modales de Viajes:** Cambiar `alert()` por un modal HTML/CSS que muestre el pipeline del viaje y el voucher.
- [ ] **F2.2 Flujo de Estatus:** Cambiar `confirm()` nativos por modales emergentes personalizados y carga interactiva.
- [ ] **F2.3 Sidebar Componente:** Extraer propiedades fijas para que el menú de navegación reaccione a la sesión en todas las pantallas.
- [ ] **F2.4 Detalles de Flota:** Incluir datos reales en el modal al inspeccionar tractos y cajas.

### FASE 3 — Completar Cobertura (✅ COMPLETADA)
> Objetivo: Contar con la operación logística 100% parametrizada.

- [x] **F3.1 Facturación:** Crear un flujo donde finanzas vea los viajes en estatus `documentado` y los cambie a `facturado`.
- [x] **F3.2 Regla R3 (Alerta Rendimiento Diesel):** Modificar el cierre de viaje en backend para que reporte rendimientos anómalos.
- [x] **F3.3 CRUDs Faltantes:** Habilitar los formularios para agregar Operadores nuevos, Tractos nuevos y Cajas nuevas desde el frontend.

### FASE 4 — Seguridad y Escalado
> Objetivo: Preparar el empaquetado para el servidor y dominios reales.

- [ ] **F4.1 Uploads Seguro:** Validaciones de MIME type y tamaño en fotos de vouchers.
- [ ] **F4.2 Protección de Rutas:** Asegurar control a nivel de Controlador (ej. RBAC).
- [ ] **F4.3 Entornos:** Definir un `.env.production` y separar credenciales.
