# Ticket: [TKT-XXX] [Título descriptivo del cambio]

**Autor / Rama**: [Nombre de rama o feature]
**Módulos Afectados**: [Módulos o dominio de negocio]
**Tipo de Cambio**: [Feature UI | Fix | Refactor | Modificación Backend | Migración BD]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [ ] **¿Modifica esquemas existentes?**: SÍ / NO
- [ ] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: SÍ / NO (⚠️ ALERTA ROJA SI ES SÍ)
- [ ] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: SÍ / NO
- [ ] **¿Requiere nueva migración en backend?**: SÍ / NO (Ruta del archivo de migración)
- [ ] **Detalle de cambios DDL**: (Columnas nuevas, tipos de datos, índices)

### 2. IMPACTO EN BACKEND (API)
- **Endpoints Nuevos / Modificados**: (Verbo HTTP + URI)
- **Políticas Shield / Roles RBAC**:
- **Compatibilidad con Contratos de API**:

### 3. IMPACTO EN FRONTEND
- **Componentes y Vistas Afectadas**:
- **Consumo de API centralizada**:
- **Manejo de Estado / Caché**:

### 4. CHECKLIST PREVIO A COMMIT
- [ ] Código verificado en local con Laragon.
- [ ] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [ ] Sin romper tipado TypeScript (`npx tsc --noEmit`).
- [ ] Sin errores de linter.
- [ ] Resumen claro redactado.
