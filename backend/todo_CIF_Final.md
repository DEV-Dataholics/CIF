# ✅ CIF — Checklist de Desarrollo MVP (Versión Final Unificada)

### Sistema de Gestión Administrativa y Operativa para Transportista de Frontera

> **Empresa:** CIF (logística integral en frontera Ciudad Juárez/El Paso)  
> **Generado por:** Planning Architect Agent  
> **Basado en:** Entrevistas de Descubrimiento (Cinthya, Omar, Adrián, Cano, Maggy, Miriam, Jesús) + **Sesiones de Metodología MAPA** (Manuel Andazola, Dirección General)  
> **Fecha:** 2026-04-06  
> **Estado:** 🔴 Pendiente

---

## 🏢 1. CONTEXTO DEL NEGOCIO Y VISIÓN DIRECTIVA

CIF es una empresa de transporte terrestre internacional con flota propia (~30+ tractocamiones, ~116 cajas) sirviendo a grandes maquiladoras (Licom, Foxcon, Biopapel, Sumitomo, DANGIL).
El MVP debe reemplazar el caos actual de múltiples buzones, WhatsApps y Excels desincronizados, integrando los sistemas obligatorios (SENCEAR/FEL para timbrado) e implementando la visión de la Dirección (Metodología MAPA):

* **Pizarrón Digital:** Claridad instantánea sobre dónde está cada unidad.
* **Cotizador Móvil:** Generación de cotizaciones en <10 minutos.
* **Auto-captura del Operador:** Eliminación de bitácoras físicas; el operador captura sus movimientos en una PWA.
* **Gamificación y Control de Diésel:** Detección de fraudes y recompensas automáticas por eficiencia.

---

## 🗃️ 2. MODELO DE DATOS Y BASE DE DATOS (Supabase / PostgreSQL)

### 🚛 2.1 Flota y Activos

- [ ] `tractocamiones`: `id`, `numero_economico`, `marca`, `placas_mx`, `placas_usa`, `permiso_sct`, `vencimiento_sct`, `fecha_ecologico`, `fecha_fisicomecanico`, `poliza_mx`, `vencimiento_mx`, `poliza_usa`, `vencimiento_usa`, `operador_asignado_id`, `estatus` (`activo`, `en_taller`, `disponible`, `fuera_base`).
* [ ] `cajas`: `id`, `numero_caja`, `tipo` (`local`, `foranea`), `placas_mx`, `placas_usa`, `ubicacion_actual`, `estatus` (`disponible`, `en_viaje`, `en_cliente`, `prestada`), `cliente_asignado_id`.
* [ ] `asignaciones_caja_cliente`: `id`, `caja_id`, `cliente_id`, `fecha_inicio`, `fecha_fin`, `tipo_servicio`, `costo_renta_acordado`.

### 👥 2.2 Personal

- [ ] `operadores`: `id`, `nombre_completo`, `numero_operador`, `tractocamion_asignado_id`, `licencia_mx_vencimiento`, `licencia_usa_vencimiento`, `fecha_ingreso`, `activo`.
* [ ] `empleados_oficina`: `id`, `nombre`, `rol` (`facturacion`, `trafico`, `finanzas`, `operaciones`, `taller`, `guardia`, `direccion`), `email`, `activo`.
* [ ] `asistencia_personal`: Registro de control de acceso para oficinistas y mecánicos.

### 🏢 2.3 Clientes

- [ ] `clientes`: `id`, `razon_social`, `tipo`, `contacto_email`, `correo_solicitudes` (oficial para portal), `tipo_facturacion`, `precio_cartaporte`, `tarifa_tiempo_extra`, `requiere_layout_excel`.

### 🗺️ 2.4 Viajes y Movimientos (Capturados por PWA)

- [ ] `viajes` (Movimientos): `id`, `cliente_id`, `operador_id`, `tractocamion_id`, `caja_id`, `tipo_movimiento` (`local_cargado`, `local_vacio`, `recoleccion`, `interplanta`, `exportacion`, `importacion`, `rampa`, `reparto`), `origen`, `destino`, `fecha_salida`, `hora_salida`, `fecha_llegada`, `hora_llegada`, `via_cruce`, `folio_boleta`, `estatus`.
* [ ] `remisiones_viaje`: Seguimiento de la recepción del documento comprobatorio foliado.

### 💰 2.5 Cotizador de Servicios (Metodología MAPA)

- [ ] `tarifas_servicio`: `id`, `tipo_servicio`, `origen`, `destino`, `distancia_km`, `costo_casetas`, `costo_diesel_estimado`, `margen_porcentaje`, `precio_base`, `vigente`.
* [ ] `cotizaciones`: `id`, `cliente_nombre`, `tipo_servicio`, `origen`, `destino`, `precio_cotizado`, `estatus` (`enviada`, `aceptada`, `rechazada`), `valido_hasta`.

### 📄 2.6 Cartas Porte y Facturación

- [ ] `cartas_porte`: `id`, `viaje_id`, `cliente_id`, `operador_id`, `tipo` (`impo`/`expo`), `folio_sat`, `uuid`, `estatus_timbrado`.
* [ ] `carta_porte_mercancias`: Detalle de mercancía, valor declarado y pedimento.
* [ ] `facturas`: `id`, `cliente_id`, `tipo_factura` (`renta_semanal`, `carta_porte`, `tiempo_extra`, `invoice_usa`), `monto`, `uuid_sat`, `estatus`, `sistema_emision`.
* [ ] `invoices_usa`: Facturas emitidas en USD, tipo de cambio y folio propio consecutivo.

### 💸 2.7 Cobranza y Cuentas por Cobrar

- [ ] `cobranza`: `id`, `factura_id`, `monto_pendiente`, `fecha_vencimiento`, `estatus`.
* [ ] `pagos_recibidos`: `id`, `factura_id`, `monto`, `metodo`, `fecha_pago`, `complemento_pago_generado`.
* [ ] **Vista Unificada** `estado_cuenta_cliente`: Combina facturas emitidas, pagos recibidos y calcula saldo pendiente en tiempo real.

### ⛽ 2.8 Control de Combustible y Prevención de Fraude

- [ ] `lecturas_odometro`: Kilometraje físico registrado (`manual_charlie`, `sistema_gps`).
* [ ] `cargas_combustible_detalle`: `tractocamion_id`, `fecha`, `litros`, `proveedor`, `costo`, `km_desde_ultima`, `rendimiento_real`, `rendimiento_objetivo`, `delta_rendimiento`.
* [ ] `bonos_combustible_operador`: Evaluación mensual para pago de bono de $1,200 MXN si se cumple el rendimiento operativo.

### 📊 2.9 Gamificación y Nómina de Operadores

- [ ] `puntos_operador`: Valor por movimiento (cargado=2pts, vacíos/rampas=1pt), limpiezas (tracto=5, caja=1).
* [ ] `scorecard_operador` y `ranking_semanal`: Puntos semanales acumulados, posición en ranking, insignias obtenidas (gamificación MAPA).
* [ ] `pagos_nomina`: Procesamiento final, consolidando sueldo base, puntos, bonos por combustible, tiempo extra y deducciones.

### 🔧 2.10 Taller y Portería

- [ ] `solicitudes_taller`: Originadas por el chófer vía PWA. `tractocamion_id`, `problema`, `urgencia`, `puede_operar`.
* [ ] `ordenes_servicio_taller`: Trabajos a realizar (preventivo/correctivo), refacciones, tiempos y costos.
* [ ] `bitacora_porteria`: Entradas y salidas controladas digitalmente por Jesús Ricardez.

---

## 🔙 3. BACKEND: LÓGICA DE NEGOCIO Y EDGE FUNCTIONS

### Roles de Acceso (RLS)

- [ ] `admin` (Manuel), `facturacion` (Cinthya), `finanzas` (Omar), `operaciones`/`trafico` (Adrián, Maggy, Miriam), `taller` (Cano), `porteria` (Jesús), `operador` (chóferes vía PWA).

### Edge Functions Clave

- [ ] `calcular-tarifas-cotizador`: Calcula diesel + casetas + margen para generar precios de viaje rápidos.
* [ ] `cierre-nomina-semanal`: Calcula puntos de gamificación y emite pre-nómina.
* [ ] `conciliar-cobranza`: Cruza pagos recibidos vs saldos y actualiza la vista de Estado de Cuenta.
* [ ] `motor-alertas`: Revisa pólizas, vencimientos de licencia, unidades >2 semanas en taller, cajas "perdidas" >24h.

---

## 🖥️ 4. MÓDULOS DEL FRONTEND (Aplicaciones)

### 📲 4.1 PWA del Operador (Mobile-First)
>
> *Elimina las 1,000 capturas manuales de Maggy.*
* [ ] Login simple con Número de Operador + PIN.
* [ ] **Captura de Movimiento:** Botón rápido para indicar Origen → Destino, Tipo, y subir foto del Voucher/Boleta firmado.
* [ ] **Solicitud a Taller SOS:** "Me falla la unidad", permite seguir o requiere grúa.
* [ ] **Mi Rendimiento:** Vista de puntos acumulados en la semana, mi lugar en el Ranking y estatus de mi bono de diesel.

### 🌐 4.2 Portal de Solicitudes para Clientes (Prioridad 1)

- [ ] URL exclusiva (ej. `clientes.cif.com/licom`).
* [ ] Formulario de solicitud formal de viajes/cruces prellenando orígenes, destinos y tarifas estándar (elimina cadenas de correos).
* [ ] Dashboard de cliente para descargar Cartas Porte PDF y Facturas/Invoices en una misma pantalla.

### 📱 4.3 App Cotizador (Visión Manuel)

- [ ] Herramienta interna 100% móvil. Selección de ruta → Cálculo instantáneo → Emisión de PDF → Botón "Compartir por WhatsApp".

### 📊 4.4 Dashboard Ejecutivo "Pizarrón Digital"

- [ ] Tarjetas visuales de flota: `🟢 En ruta` | `🔴 En Taller` | `⚪ Disponible`. Conocer disponibilidad de cajas libres en un máximo de 3 segundos (Regla de diseño de Manuel).
* [ ] KPI "Costo de tener parados": Estima la pérdida diaria por las unidades inactivas.

### 📄 4.5 Módulos Backoffice

- [ ] **Tráfico y Cajas:** Control posicional de las 116 cajas.
* [ ] **Facturación y Cobranza:** Entorno unificado Cinthya/Miriam para emitir facturas, reportar Invoices USA, y registrar pagos al "Estado de Cuenta Cliente".
* [ ] **Nómina y Puntos:** Entorno para Omar/Maggy para auditar y autorizar el Scorecard semanal de los operadores.
* [ ] **Taller:** Panel de Arnoldo Cano para autorizar solicitudes SOS de los choferes y despachar reparaciones.

---

## ⚙️ 5. DESPLIEGUE Y MIGRACIÓN

### Datos Semilla

- [ ] Importar Excel de control de cajas de Adrián (116 unidades).
* [ ] Importar histórico de Diésel 2023-2025 de Omar.
* [ ] Cargar catálogo de ubicaciones SAT, Clientes frecuentes y Tabulador de Puntos de Operación.

### Pendientes MAPA (Stakeholders)

- [ ] Confirmar con Omar el *valor unitario en pesos* de cada punto de nómina operativo.
* [ ] Confirmar con Manuel el margen % bruto esperado en las cotizaciones por sistema.
* [ ] Integrar feedback final del Despacho Contable (Suegro/Cuñado) sobre formatos de exportación fiscal.
