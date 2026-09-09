# Ticket: [TKT-CIF-027] Rediseño de Pantalla de Login (Split Screen Desktop + Hero + Nuevo Logo)

**Autor / Rama**: main / feature-login-redesign
**Módulos Afectados**: Frontend (Auth / Login View)
**Tipo de Cambio**: Feature UI / UX Redesign

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración en backend?**: NO
- [x] **Detalle de cambios DDL**: Ninguno (cambio 100% en capa de presentación frontend).

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: Ninguno. Consume `POST /api/auth/login`.
- **Políticas Shield / Roles RBAC**: Respeta la autenticación y sesión existente por cookie y JSON de respuesta.
- **Compatibilidad con Contratos de API**: Mantiene el payload `{ email, password }` y el manejo de respuesta `{ ok, usuario, mensaje }`.

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**: `frontend/src/pages/Login.jsx`, assets corporativos (`frontend/public/assets/logo-corporativo.png`).
- **Consumo de API centralizada**: Petición a `/api/auth/login` con credenciales y almacenamiento en `sessionStorage`.
- **Manejo de Estado / Caché**: Estados locales de formulario, toggle de visibilidad de contraseña, feedback de carga y errores.

### 4. CHECKLIST PREVIO A COMMIT
- [x] Código verificado en local con Laragon.
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [x] Sin errores de linter (`npm run lint`).
- [x] Resumen claro redactado.
- [x] Diseño dual-tone implementado: Hero izquierdo en Light Mode y Tarjeta de login en Dark Mode.
