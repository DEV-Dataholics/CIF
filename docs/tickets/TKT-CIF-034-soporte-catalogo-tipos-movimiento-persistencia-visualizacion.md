# Ticket: [TKT-CIF-034] Persistencia y Visualización de Tipos de Movimiento del Catálogo en Viajes

**Autor / Rama**: Antigravity AI / `main`
**Módulos Afectados**: Base de Datos (`viajes`), Backend (`ViajeController`), Frontend (`SuperCapturaWizard.jsx`, `DataContext.jsx`, `db.js`, `Movimientos.jsx`)
**Tipo de Cambio**: Fix / DDL de compatibilidad / Hidratación de Estado / UI

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: SÍ
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: SÍ (`ALTER TABLE viajes MODIFY tipo_movimiento VARCHAR(255) NOT NULL;`)
- [x] **Detalle de cambios DDL**: 
  - La columna `viajes.tipo_movimiento` estaba tipada como un `ENUM('local_cargado','local_vacio','recoleccion','interplanta','exportacion','importacion','rampa','reparto')`. Al registrar movimientos con los 55 tipos reales del catálogo (`tiposmovimiento`), MySQL en modo no-estricto truncaba cualquier valor no coincidente a una cadena vacía (`""`), perdiendo el tipo seleccionado.
  - Se amplía el campo a `VARCHAR(255) NOT NULL` (alineado con la directiva arquitectónica previa en `backend/api/public/alter_viajes_enum.php`).

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: `POST /api/viajes`, `PUT /api/viajes/{id}`, `GET /api/viajes`
- **Políticas Shield / Roles RBAC**: Sin cambios en permisos.
- **Compatibilidad con Contratos de API**: Total compatibilidad retrospectiva: almacena cadenas completas y slugs sin truncamiento a vacío.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
  - `SuperCapturaWizard.jsx`: Guarda el nombre o tipo exacto de movimiento (`r.tipoMov`) garantizando que llegue al backend.
  - `db.js`: En `normalizePayload`, no sobreescribir `tipo_movimiento` si ya se especificó un valor válido o `tipoMov`.
  - `DataContext.jsx`: Resolución robusta de `tipoMov` al hidratar viajes: busca por ID numérico, por coincidencia de nombre exacto (case-insensitive) y por formato slug, asignando siempre el nombre oficial de `tiposmovimiento`.
  - `Movimientos.jsx`: Renderizado defensivo en la columna `tipoMov`:
    - Erradicación de badges vacíos con punto rojo cuando el valor es nulo o vacío (`—`).
    - Clasificación armónica de badges (`badge-success`, `badge-warning`, `badge-info`, `badge-muted`) según el tipo de traslado.
- **Consumo de API centralizada**: Vía cliente centralizado `db.js`.
- **Manejo de Estado / Caché**: `DataContext` sincronizado con los catálogos y actualización inmediata tras la captura.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon y Vite dev server.
- [x] DDL ejecutado y verificado en base de datos local `cif_local_clone`.
- [x] Datos existentes vacíos (IDs 16 y 17) actualizados con tipos válidos.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Pruebas unitarias de frontend (`npm test -- --run`) pasando al 100%.
- [x] Verificación en navegador comprobando que la columna "TIPO MOV" muestra el badge y texto legible correcto.
- [x] Resumen claro redactado y registrado en walkthrough.

