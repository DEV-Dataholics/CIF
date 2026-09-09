# TKT-CIF-029: Optimización de Paleta y Contraste en Modo Claro (Light Mode)

## 1. Identificación del Ticket
- **Código:** TKT-CIF-029
- **Módulo:** UI / Theme Global (Light Mode) & Componentes
- **Responsable:** Antigravity AI
- **Fecha de Inicio:** 2026-09-09
- **Estado:** COMPLETO

## 2. Descripción del Problema
Tras la modernización de la paleta oscura (Dark Mode), la vista en modo claro (Light Mode) presentaba deficiencias severas de contraste y legibilidad:
1. **Textos Invisibles por `text-white` rígido:** En componentes como `Dashboard.jsx`, `Cobranza.jsx`, `Accesos.jsx` y `AdminCrud.jsx`, títulos principales, cifras de KPIs y tablas tenían `text-white` quemado en código, provocando texto blanco sobre tarjetas claras completamente ilegible.
2. **Superficies Muddy/Beige en vez de Contenedores Blancos Pulidos:** Las variables CSS en `[data-theme="light"]` usaban `--color-surface-container: #E4E2DE` y `--color-surface-container-low: #ECEAE7`, lo que producía un aspecto beige sucio y apagado. Las tarjetas ejecutivas deben ser blanco puro (`#FFFFFF`) sobre un fondo base de lienzo claro (`#F8FAFC`) con bordes sutiles de pizarra (`#E2E8F0`).
3. **Badges con Colores Pastel de Modo Oscuro:** Clases como `.badge-danger`, `.badge-warning`, `.badge-success` utilizaban colores fluorescentes desaturados (`#4ade80`, `#38bdf8`, `#f87171`) que en modo claro quedaban sobreexpuestos e ilegibles.
4. **Botones con Efecto 'Borrado a la Derecha' (Bug de Degradados):** Botones como `AÑADIR TARIFA MANUAL` y botones en reportes utilizaban `bg-gradient-to-r from-primary to-primary-hover`. Dado que `primary-hover` no existía en `tailwind.config.cjs`, Tailwind lo interpretaba como `transparent`, produciendo un desvanecimiento hacia transparente que borraba el extremo derecho del botón y de su texto tanto en modo claro como en modo oscuro.

## 3. Alcance de la Solución
1. **Tokens de Modo Claro (`frontend/src/index.css`):**
   - `--color-surface`: `#F8FAFC` (fondo base fresco y limpio)
   - `--color-surface-container-lowest`: `#FFFFFF`
   - `--color-surface-container-low`: `#FFFFFF` (tarjetas base blancas)
   - `--color-surface-container`: `#FFFFFF` (contenedores principales)
   - `--color-surface-container-high`: `#F1F5F9` (encabezados de tabla, hover, filter bars)
   - `--color-surface-container-highest`: `#E2E8F0` (pills, tracks y bordes activos)
   - `--color-outline`: `#64748B` (texto secundario e iconos de alta legibilidad)
   - `--color-outline-variant`: `#E2E8F0` (bordes nítidos y modernos)
   - `--color-on-surface`: `#0F172A` (texto principal charcoal/slate profundo)
   - `--color-on-surface-variant`: `#334155`
   - `--color-primary`: `#B47B1E` (dorado ámbar con ratio WCAG AA >= 4.5:1 sobre blanco)
   - `--color-primary-container`: `#FEF3C7`
   - `--color-on-primary-container`: `#78350F`
   - Badges adaptativos para `[data-theme="light"]` con tipografía oscura saturada.
2. **Corrección de `text-white` en Componentes y Páginas:**
   - `Dashboard.jsx`, `Cobranza.jsx`, `Accesos.jsx`, `AdminCrud.jsx`, `DataTable.jsx`.
3. **Resolución del Efecto 'Borrado a la Derecha' y Botones de Acento:**
   - Eliminación de `to-primary-hover` fantasma en `ConcentradoPrecios.jsx`, `Reportes.jsx`, `ReportesPrefacturacion.jsx`, `ReportesFolio.jsx` y `ReportesClientes.jsx`.
   - Estandarización a degradado dorado metálico sólido (`bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] text-[#070709] font-bold rounded-xl shadow-md`).
4. **Validación y Compuertas:**
   - `.\verificar.ps1` 100% verde (Typecheck, Linting, Routes).
   - Verificación visual completa mediante browser automation tanto en Light como en Dark mode.

## 4. Criterios de Aceptación
- [x] Cero texto blanco invisible sobre fondo claro en ninguna pantalla del sistema.
- [x] Tarjetas y contenedores en blanco puro (`#FFFFFF`) con bordes slate limpios (`#E2E8F0`).
- [x] Badges y etiquetas de estado con contraste óptimo (WCAG AA) en modo claro.
- [x] Botones dorados corporativos con tipografía oscura nítida, sin desvanecimientos transparentes ni efecto borrador a la derecha.
- [x] Compuerta de calidad `.\verificar.ps1` 100% en verde.
