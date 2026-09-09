# Ticket: [TKT-CIF-031] Opacidad y Color Sólido en Tarjetas de Súper Captura (Dark & Light Mode)

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Frontend (`SuperCapturaWizard.jsx`)
**Tipo de Cambio**: Feature UI / Refactor de Estilos / Eliminación de Transparencias

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Cambio estrictamente confinado a la capa de presentación y componentes de UI en Frontend.

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: Ninguno.
- **Políticas Shield / Roles RBAC**: Sin cambios.
- **Compatibilidad con Contratos de API**: Mantiene integridad con endpoints existentes de registro múltiple (`/api/viajes/registrar`).

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `frontend/src/components/SuperCapturaWizard.jsx`:
    - Eliminación de modificadores de opacidad relativa (`/50`, `/60`, `/80`, `/90`, `/98`) y efectos `backdrop-blur` en contenedores y tarjetas principales.
    - Asignación de tokens de superficie sólidos y elegantes:
      - Fondo del modal: `bg-surface` (Obsidiana `#09090c` en Dark / Slate `#F8FAFC` en Light).
      - Encabezado y tarjetas (Pasos 1, 2 y 3): `bg-surface-container-low` (`#111115` en Dark / `#FFFFFF` puro en Light) con bordes nítidos `border-outline-variant` y sombra `shadow-md`.
      - Encabezados de tablas: `bg-surface-container-high` sólido (`#1f1f24` en Dark / `#F1F5F9` en Light).
      - Inputs y controles: Fondos sólidos `bg-surface` con bordes limpios y texto contrastante `text-on-surface`.
- **Consumo de API centralizada**: Inalterado vía `db.js`.
- **Manejo de Estado / Caché**: Sin cambios en la reactividad de `DataContext`.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Pruebas unitarias de frontend (`npm test -- --run`) pasando al 100% (16/16).
- [x] Verificación visual en Dark y Light Mode de la Súper Captura completada con evidencia fotográfica.
- [x] Resumen claro redactado y registrado en walkthrough.
