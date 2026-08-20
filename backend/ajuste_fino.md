# Ajuste Fino - Log de Problemas y Mejoras (CIF Logistics)

Este documento es una bitácora viva para detectar, documentar y agendar la resolución de inconsistencias visuales y funcionales en toda la plataforma antes del lanzamiento final de la **Gold Update**.

---

## Observaciones Detectadas

### 1. Inconsistencia de Menús de Navegación

- **Problema:** Pantallas como `home.html` y `dashboard.html` cuentan con un **menú superior (Top Bar)** alineado al diseño Premium, mientras que otros módulos (como `flota.html`, `taller.html`, `operadores.html`) conservan el antiguo **menú lateral (Side Bar)**.
- **Resolución a aplicar:** Eliminar por completo el menú lateral de la plataforma. La navegación correcta y oficial es el **Menú Superior** (como en el Dashboard), ya que bajo el nuevo diseño "Gold Update" libera todo el ancho de la pantalla (*Full-Width*) para maximizar el área de trabajo en las tablas y tableros. Todo el sistema debe ser homogéneo.
- **Estado:** Pendiente de ejecución.

---

### 2. Rigidez en el Pipeline de Estatus (Viajes)

- **Problema:** Actualmente el ciclo de vida del viaje asume linealmente que todos pasan por "Aduana" y el personal de tráfico en oficina es el único que puede avanzar este estado en computadora.
- **Resolución a aplicar:**
  1. *Pipeline Dinámico:* Si la "Transacción Operativa" es Local o Rampa, el sistema debe saltarse la fase de Aduana. Solo Exportación/Importación deben incluirla.
  2. *Empoderamiento Móvil:* Añadir un botón en la App del Operador (`pwa-operador.html`) para que el conductor pueda reportar "En Fila de Aduana / Cruce" por cuenta propia, pasando la responsabilidad del evento a quien está en campo.
  3. *Control Estricto de Cierre:* Tráfico y Facturación mantienen exclusividad para fases administrativas (`documentado` y `facturado`).
- **Estado:** Pendiente de ejecución.

---

### 3. Trazabilidad Ciega de Cajas (Remolques)

- **Problema:** El estatus de las cajas se actualiza mediante un proceso *invisible* ("under the hood"). El dueño sabe que la caja está `en_viaje` o `disponible`, pero visualmente carece del **DÓNDE** y el **CON QUIÉN**. El nivel de detalle actual no es suficiente para prevenir el robo o abandono de equipo.
- **Resolución a aplicar:**
  1. *Vinculación Visual Interactiva:* Modificar el front-end del módulo de Cajas (`flota.html` u otro futuro) para que no solo diga `en_viaje`, sino que hipervincule el dato exacto: **"Viaje #4002 - En tránsito hacia Monterrey con Op. Juan Pérez"**.
  2. *Geolocalización Lógica (Patios):* Cuando el conductor finalice el viaje en el destino de un cliente, la caja NO debería marcarse solo como `disponible`, sino como `en_patio_cliente` vinculado a la geocerca u origen de esa operación hasta que otro viaje la recoja.
- **Estado:** Pendiente de ejecución.

---

### 4. Bloqueo Funcional en Taller y Trazabilidad de Refacciones

- **Problema:** En el módulo de Operaciones -> Taller, la interfaz permite ver el tablero de SOS y las órdenes activas, pero **no funciona el mecanismo para generar nuevas órdenes de servicio**. Además, es imposible auditar el gasto de mantenimiento porque no existe forma de capturar qué refacciones se compraron, ni asociar ese costo exacto a una `unidad` transversalmente.
- **Resolución a aplicar:**
  1. *Habilitar Formulario Modal:* Construir y habilitar el panel *drawer* para crear solicitudes asociadas forzosamente al inventario de unidades (`tractocamion_id`).
  2. *Desglose Dinámico:* Integrar un sub-módulo dentro del formulario para capturar un arreglo de `Refacciones`, donde el mecánico deba teclear el Concepto, la Cantidad y su Costo Unitario.
  3. *Inversión Automatizada:* Sumar los renglones en tiempo real para generar un tabulador inteligente de costos (`costo_estimado`), amarrando ese histórico financiero directamente a la bitácora del vehículo.
- **Estado:** Pendiente de ejecución (Existen planes en `PLAN_TALLER_Y_REFACCIONES.md`).

---

### 5. Contaminación de Datos por Rutas Manuales

- **Problema:** Actualmente, los campos de `Origen` y `Destino` (tanto en la aplicación del operador como en el módulo de Tráfico) son campos de escritura libre (*Text Inputs*). Esto provoca que un mismo lugar se registre de mil formas distintas ("Licom", "Planta Licom", "Plataforma L"), destruyendo la posibilidad de hacer un análisis de datos o *Data Mining* preciso para saber cuánto cuesta, dura o rinde una ruta en específico.
- **Resolución a aplicar:**
  1. *Motor de Catálogos:* Crear un nuevo catálogo centralizado de **"Puntos / Geocercas"** o **"Rutas Predeterminadas"** en la base de datos (Ej. "Planta XYZ -> Puente de Comercio Mundial").
  2. *Reemplazo de Inputs:* Modificar todos los formularios de la app para que `Origen` y `Destino` sean menús desplegables (*Selects* o Autocompletado inteligente) forzando el dato de la base de datos central.
  3. *Beneficio en Analítica:* Al estandarizar las llaves primarias, el sistema de Dashboards podrá agrupar sin errores estadísticos para medir rendimientos de diésel por ruta o retrasos estandarizados en aduanas concretas.
- **Estado:** Pendiente de ejecución.

---

### 6. Ausencia de Auditoría de Limpieza (Checklist 360)

- **Problema:** La cultura de cuidado de los tractos y cajas es invisible. Actualmente no existe un registro ni en Tráfico ni en la PWA del operador para evaluar, evidenciar o premiar a los conductores que mantienen limpia y en buenas condiciones su unidad operativa.
- **Resolución a aplicar:**
  1. *Checklist Pre-Viaje / Post-Viaje:* Agregar un paso opcional en la PWA (`pwa-operador.html`) llamado **"Reporte de Lavado / Inspección"**, donde se registre la fecha de limpieza y el chofer pueda subir una fotografía (evidencia) demostrando la limpieza de su tractocamión y su caja.
  2. *Auditoría Cruzada:* Tráfico o Auditoría pueden validar esa foto en su panel administrativo y detonar una recompensa de Puntos en su nivel de *Gamification* ("+1 Punto por Pulcritud"). Esto inyectará sentido de pertenencia y cuidado a los activos.
- **Estado:** Pendiente de ejecución.

---
*(Se irán agregando más puntos en función de la dinámica Q&A).*
