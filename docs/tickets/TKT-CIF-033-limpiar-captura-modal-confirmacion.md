# Ticket: [TKT-CIF-033] Erradicación de window.confirm y Modal de Confirmación para Limpiar Captura

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Frontend (`SuperCapturaWizard.jsx`)
**Tipo de Cambio**: Fix UI / Usabilidad / Erradicación de Diálogo Nativo Bloqueado

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. La limpieza de captura afecta únicamente el estado local y el borrador en `localStorage` del cliente.

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: Ninguno.
- **Políticas Shield / Roles RBAC**: Sin cambios.
- **Compatibilidad con Contratos de API**: Inalterada.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `frontend/src/components/SuperCapturaWizard.jsx`:
    - Reemplazo de la llamada nativa bloqueada `window.confirm()` por un modal reactivo de confirmación (`ConfirmClearModal`).
    - Explicación clara al usuario sobre el borrado de operador, asignación de equipo y rutas no guardadas.
    - Ejecución atómica de limpieza: reinicio de estados en React (`step: 1`, `operador: ''`, `tractor: ''`, `caja: ''`, `cliente: ''`, `routes: []`, `routeForm: empty`) y eliminación garantizada de la llave `cif_supercaptura_draft` en `localStorage`.
- **Consumo de API centralizada**: Sin llamadas remotas necesarias para limpiar el borrador local.
- **Manejo de Estado / Caché**: El estado de captura vuelve limpiamente a su estado inicial.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Pruebas unitarias de frontend (`npm test -- --run`) pasando al 100%.
- [x] Verificación en navegador del botón "Limpiar Captura" abriendo el modal de confirmación y limpiando los campos por completo.
- [x] Resumen claro redactado y registrado en walkthrough.
