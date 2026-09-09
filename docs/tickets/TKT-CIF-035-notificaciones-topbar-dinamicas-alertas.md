# Ticket: [TKT-CIF-035] Dinamización del Contador de Notificaciones / Alertas en TopBar

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Frontend (`TopBar.jsx`)
**Tipo de Cambio**: Fix UI / Usabilidad / Erradicación de Dato Mock Hardcodeado

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno.

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: Ninguno.
- **Políticas Shield / Roles RBAC**: Sin cambios.
- **Compatibilidad con Contratos de API**: Inalterada.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `frontend/src/components/TopBar.jsx`:
    - Erradicación del badge rojo estático con el número `3` hardcodeado en la campana de notificaciones.
    - Integración con `useData()` para calcular en tiempo real el número de alertas críticas (vencimientos &le; 30 días en operadores y tractocamiones).
    - Ocultamiento condicional del badge: si el conteo es 0, no se muestra ningún badge rojo, dejando la campana limpia.
    - Indicador reactivo y tooltip contextual ("Sin alertas pendientes" o "N alertas del sistema").
- **Consumo de API centralizada**: Consume los catálogos ya provistos por `DataContext`.
- **Manejo de Estado / Caché**: Reactivo al estado global de operadores y unidades.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Pruebas unitarias de frontend (`npm test -- --run`) pasando al 100% (18/18 pruebas).
- [x] Verificación en navegador comprobando que el icono de campana ya no muestra un badge falso cuando no hay alertas pendientes.
- [x] Resumen claro redactado y registrado en walkthrough.

