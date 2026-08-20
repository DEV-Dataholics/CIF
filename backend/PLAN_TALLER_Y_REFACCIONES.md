# Plan: Módulo Taller y Órdenes de Servicio (Refacciones)

Este plan detalla técnica y visualmente cómo activaremos el panel de creación de Órdenes de Servicio en el Taller, asegurando la trazabilidad transversal hacia las unidades ("llave tractocamion_id") e integrando el control detallado de refacciones y costos.

## 1. Propuesta Visual y Funcional (Frontend: `taller.html`)

- **Migración a Gold Update**: Reescribiremos y rediseñaremos `taller.html` para unificar la estética de toda la plataforma mediante el nuevo layout (Phosphor Icons, Matte Grain, Cards y Bottom-Drawers) que usamos en `viajes` y `dashboard`.
- **Modal Dinámico de Creación de Orden**: Se construirá un Panel/Drawer Lateral que contenga el **Formulario de Nueva Orden**.
- **Captura de Refacciones en Tiempo Real**: En lugar de solo capturar texto, el formulario integrará un arreglo en AlpineJS para añadir **Múltiples Refacciones** en renglones. El operador podrá definir `Concepto`, `Cantidad` y `Costo Unitario`. 
- **Tabulador de Inversión Automático**: El sistema multiplicará Cantidad x Costo de cada renglón y sumará todo el total en el `Costo Estimado` general a depositar directamente a la unidad seleccionada.

## 2. Desarrollo en el Motor de Base de Datos y APIs

Actualmente CodeIgniter guarda en la tabla `ordenes_servicio_taller` un campo `costo_estimado` global y el `tractocamion_id`.

**Opción A (Recomendada Escalable):** Crear una nueva tabla transaccional en tu base de datos llamada `ordenes_taller_refacciones`.
- El controlador de `crearOrden()` extraerá el array de `[refacciones]`.
- Creará la orden general.
- Insertará cada "refacción" vinculada al `orden_id` en la nueva tabla para poder generar reportes exactos de qué se le ha comprado a la unidad y en qué fechas.

**Opción B (Sencilla, tipo JSON):** Guardar todo el arreglo de renglones como un campo `JSON` dentro de una columna nueva `refacciones_json` en la misma tabla de la Orden. (Es más rápido pero limita el reporte contable a futuro).

---

### Cambios Específicos:

#### Archivo: `public_html/taller.html` & `C:\laragon\www\cif\taller.html`
- Cambio estético estructural eliminando la `side-bar` vieja e integrando el `top-header`.
- Programar el modal de alta con las directivas `x-model` conectadas a `formOrden`.

#### Archivo: `api/app/Controllers/TallerController.php`
- Modificar la validación al crear órdenes para aceptar `refacciones` como array desde el FrontEnd.
- Crear el Query a nivel controlador que ejecute el guardado según decidas (Opción A o B).

---

> **Pregunta Importante para Proceder:**
> Antes de escribir el código de los cambios, ¿prefieres que en el Backend creemos una tabla nueva de base de datos dedicada pura y exclusivamente para enumerar `refacciones` e insertemos el listado ahí (Opción A), o prefieres un guardado más rápido en tipo JSON sin tabla adicional (Opción B)?
