# TKT-CIF-028: Modernización de Paleta Dark Mode y Eliminación de Bordes de Alto Contraste

## 1. Identificación del Ticket
- **Código:** TKT-CIF-028
- **Módulo:** UI / Theme Global & Componentes Internos
- **Responsable:** Antigravity AI
- **Fecha de Inicio:** 2026-09-09
- **Estado:** COMPLETO

## 2. Descripción del Problema
Dentro del sistema (post-login), el modo oscuro presentaba líneas y bordes blancos de alto contraste (`outline-variant`, bordes toscos de 0px borderRadius forzado en `tailwind.config.cjs`, fondos grisáceos disonantes con `--color-surface: #131314` y bordes claros) que generaban una apariencia "old-school" y rígida.
El usuario solicitó unificar la paleta oscura interna con el equilibrio de color refinado, moderno y elegante obtenido en la pantalla de Login (`#09090c` fondo, `#111115` contenedores/tarjetas, `#27272a` bordes sutiles, detalles en dorado corporativo `#d1a14e`, tipografía nítida con tonos zinc `#e4e4e7` / `#a1a1aa`, y bordes redondeados orgánicos).

## 3. Alcance de la Solución
1. **Tokens de Diseño y Tailwind Config:**
   - Se removió el override destructivo de `borderRadius: 0px` en `frontend/tailwind.config.cjs`, restaurando los radios orgánicos (`rounded-lg`, `rounded-xl`, `rounded-2xl`).
   - Se redefinieron los tokens de color dark mode en `frontend/src/index.css`:
     - `--color-surface`: `#09090c` (fondo obsidian)
     - `--color-surface-dim`: `#09090c`
     - `--color-surface-container-lowest`: `#070709`
     - `--color-surface-container-low`: `#111115`
     - `--color-surface-container`: `#16161b`
     - `--color-surface-container-high`: `#1f1f24`
     - `--color-surface-container-highest`: `#28282f`
     - `--color-outline-variant`: `#27272a` (líneas sutiles sin alto contraste)
     - `--color-outline`: `#52525b`
     - `--color-on-surface`: `#f4f4f5`
     - `--color-on-surface-variant`: `#a1a1aa`
     - Badges, pildoras y cabeceras de tabla suavizadas.
2. **Componentes y Layout Reutilizables:**
   - `frontend/src/components/Sidebar.jsx`: Items de navegación `rounded-xl`, estados activos en dorado suave, logo corporativo nítido.
   - `frontend/src/components/TopBar.jsx`: Divisores sutiles `border-outline-variant`, botones redondeados.
   - `frontend/src/components/DataTable.jsx`: Contenedor `rounded-2xl`, bordes de fila ultra finos y discretos, buscador y paginador `rounded-lg`.
   - `frontend/src/components/AdminCrud.jsx`: Tabla y modal `rounded-2xl`, inputs `rounded-xl`, botones primarios en dorado corporativo.
   - `frontend/src/components/ColumnEditor.jsx` & `SearchableSelect.jsx`: Dropdowns `rounded-2xl` y `rounded-xl` con fondo `surface-container`.
   - `frontend/src/components/SuperCapturaWizard.jsx`: Modal y steps con esquinas redondeadas `rounded-2xl`, inputs y botones refinados.
3. **Páginas Core y Submódulos:**
   - `Dashboard.jsx`: Filtros y KPI cards `rounded-2xl`, métricas en verde/azul/dorado armónicos, acordeón operativo pulido.
   - `Movimientos.jsx`: Barra de filtros `rounded-2xl`, botón Súper Captura con degradado dorado `rounded-xl`.
   - `Accesos.jsx`: Tarjeta de reloj en tiempo real, formulario de registro y tarjetas de presencia en patio `rounded-2xl`.
   - `Cobranza.jsx`: Tarjetas de estado de morosidad y semáforo KPI `rounded-2xl`, tabla de facturas estilizada.
   - `Reportes.jsx`: Selector de reportes y panel de filtrado `rounded-2xl`.
   - `Alertas.jsx`: Contenedor de columnas `rounded-2xl`, tarjetas de alertas por severidad y corrección de tildes UTF-8.
   - `ConcentradoPrecios.jsx`: Tabla agrupada por clientes `rounded-2xl`, modales de captura y edición de tarifas `rounded-2xl`.
   - Módulos `Reportes*.jsx` (Prefacturacion, Operadores, Folio, Facturacion, Clientes, Cajas): Filtros, tarjetas estadísticas y desgloses actualizados.
4. **Validación y Compuerta:**
   - `.\verificar.ps1`: Typecheck (tsc), Lint (eslint) y Rutas CI4 pasaron con cero errores: `[OK] COMPUERTA EN VERDE`.
   - Pruebas visuales mediante subagente de navegador con autenticación completa capturando evidencia en video y capturas en alta resolución.

## 4. Criterios de Aceptación
- [x] Cero líneas blancas de alto contraste estilo retro/brutalista en modo oscuro.
- [x] Bordes sutiles, elegantes y unificados con la estética del Login (`#27272a`).
- [x] Border radius moderno aplicado armónicamente en todo el sistema (`rounded-xl` / `rounded-2xl`).
- [x] Compuerta de calidad `.\verificar.ps1` 100% en verde.
