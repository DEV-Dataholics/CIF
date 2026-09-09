# Ticket: [TKT-CIF-030] Auditoría QA, Errores de Consola y Estabilización de Interacción UI-Base de Datos

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Frontend (`db.js`, `DataContext.jsx`, `Accesos.jsx`, `Movimientos.jsx`, `Usuarios.jsx`) & Backend (`Routes.php`, `TiposMovimientoController.php`, `PreciosController.php`)
**Tipo de Cambio**: Fix / QA / Estabilización Frontend-Backend

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO (Esquema de MySQL en Laragon preservado intacto)
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Se pobló el catálogo maestro `tiposmovimiento` con 55 registros base mediante seeder `TiposMovimientoSeeder.php` para sincronizar con la fuente de verdad.

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**:
  - `GET/POST/PUT/DELETE /usuarios` (Registrados en `Routes.php`, resolviendo 404)
  - `GET/POST/PUT/DELETE /tiposMovimiento` (Refactorizado con CORS y credenciales en `TiposMovimientoController.php`)
  - `GET/POST/PUT/DELETE /precios` (Refactorizado con CORS y credenciales en `PreciosController.php`)
- **Políticas Shield / Roles RBAC**: Protegidos bajo filtro `'auth'`.
- **Compatibilidad con Contratos de API**:
  - Homologación de respuestas JSON con cabeceras `Access-Control-Allow-Origin: $origin` y `Access-Control-Allow-Credentials: true`.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `frontend/src/services/db.js`: Mapeo y normalización automática de payloads (camelCase a snake_case) para compatibilidad exacta con contratos backend (`operadorId` -> `operador_id`, `tractorId` -> `tractocamion_id`, etc.). Manejo robusto de errores sin romper renderizado.
  - `frontend/src/pages/Accesos.jsx`: Normalización de payload en captura rápida de caseta y corrección de valores de estatus compatibles con el enum de base de datos.
  - `frontend/src/pages/Movimientos.jsx`: Ajuste en edición de viajes para enviar slugs válidos en `tipo_movimiento` y respetar columnas del backend.
  - `frontend/src/pages/admin/Usuarios.jsx`: Conexión estable con el endpoint `/api/usuarios`.
  - Pruebas unitarias/QA (`vitest`): Corrección de mocks de URL relativa en entorno Node.js / jsdom.
- **Consumo de API centralizada**: Todo el flujo de datos continúa gobernado a través de `db.js`.
- **Manejo de Estado / Caché**: `DataContext` sincroniza reactivamente tras inserciones, actualizaciones y eliminaciones.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Resumen claro redactado y registrado en walkthrough.
