# Ticket: [TKT-CIF-032] Herramienta de Alta Rápida en Origen/Destino de Súper Captura y Homologación de API

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Frontend (`SuperCapturaWizard.jsx`, `SearchableSelect.jsx`) & Backend (`DestinosController.php`)
**Tipo de Cambio**: Fix UI / Nueva Característica de Captura / Homologación API

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Se utiliza la tabla existente `destinos` en MySQL `cif_local_clone`.

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**:
  - `POST /destinos_catalogos`: Homologación en `DestinosController.php` heredando de `BaseController` y respondiendo con las cabeceras `Access-Control-Allow-Origin: $origin` y `Access-Control-Allow-Credentials: true` para aceptar sesiones web del frontend sin bloqueos de CORS.
- **Políticas Shield / Roles RBAC**: Protegido bajo filtro `auth`.
- **Compatibilidad con Contratos de API**: Respuesta JSON `{ ok: true, id: N, destinos: [...] }`.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `frontend/src/components/SuperCapturaWizard.jsx`:
    - Erradicación de `window.prompt()` (bloqueado/suprimido por navegadores modernos).
    - Implementación de `QuickAddModal`: Modal moderno integrado al diseño del sistema (Dark/Light mode) para el alta rápida de Ubicaciones (Origen/Destino), Operadores, Cajas y Clientes con validación de campo requerido y notificación de guardado.
    - Habilitación de `allowFreeText={true}` en los campos `SearchableSelect` de Origen y Destino para permitir además captura manual directa.
- **Consumo de API centralizada**: Vía `crud.insert('localidades', ...)` y `refreshData()`.
- **Manejo de Estado / Caché**: Actualización reactiva inmediata del catálogo de ubicaciones en `DataContext`.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Pruebas unitarias de frontend (`npm test -- --run`) pasando al 100% (16/16).
- [x] Verificación en navegador del botón `+` en Origen y Destino agregando y seleccionando exitosamente la nueva ubicación.
- [x] Resumen claro redactado y registrado en walkthrough.
