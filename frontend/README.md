# Sistema CIF - Logística Operativa (Moderna) — `v0.9.0` (Fase Beta)

Plataforma de optimización de Bitácora Operativa y Reportes de Pre-facturación en dólares (USD) para operaciones de transporte logístico. Desarrollada con **React + Vite + Tailwind CSS**.

---

## 🚀 Comenzar (Desarrollo Local)

Para levantar el proyecto en tu entorno local, sigue estos pasos:

1. **Instalar las dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *El sistema estará disponible en `http://localhost:5173` (o el puerto configurado por Vite).*

3. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🛠️ Estructura del Proyecto

*   `src/data/`: Bases de datos locales temporales (archivos `.json` de clientes, operadores, tarifas y bitácora).
*   `src/pages/`: Vistas principales de la aplicación (Súper Captura, Administración de Tarifas, Reportes, etc.).
*   `src/components/`: Componentes UI reutilizables.
*   `tests/`: Pruebas de integración y E2E configuradas con Playwright.

---

## 🔌 Transición a Producción (Backend PHP + SQL)

Este sistema frontend actualmente funciona bajo una arquitectura mockizada utilizando JSONs locales como base de datos de pruebas.

Para conectar este desarrollo a tu base de datos de producción y backend PHP:
*   Consulta el documento descriptivo [CONTRATO_JSON.md](file:///c:/Users/gruiz/OneDrive/Documentos/CIF_FINAL/moderna/CONTRATO_JSON.md) en la raíz.
*   Allí encontrarás el **esquema SQL (DDL)** sugerido y la especificación de los **Endpoints JSON** requeridos por esta interfaz.
