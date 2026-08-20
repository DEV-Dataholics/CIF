# Contrato de Integración Frontend-Backend (Sistema CIF)

Este documento sirve como especificación técnica y contrato de integración para el desarrollador que asuma la responsabilidad de trasladar el demo del frontend (el cual actualmente consume archivos JSON locales en `src/data/`) hacia un entorno de producción real utilizando un backend en **PHP** (o similar) y una base de datos relacional (**SQL Server / MySQL**).

---

## 1. Diseño Sugerido de la Base de Datos (DDL)

A continuación se propone el esquema SQL que modela de manera idéntica las estructuras de datos que el frontend actualmente consume e interactúa:

```sql
-- 1. Catálogo de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    rol VARCHAR(50) DEFAULT 'operador',
    permiso INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    rfc VARCHAR(13) DEFAULT '',
    contacto VARCHAR(100) DEFAULT '',
    telefono VARCHAR(20) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Catálogo de Unidades (Tractores)
CREATE TABLE unidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_economico VARCHAR(50) NOT NULL UNIQUE,
    placas_mx VARCHAR(20) DEFAULT '',
    placas_us VARCHAR(20) DEFAULT '',
    vin VARCHAR(17) DEFAULT '',
    modelo VARCHAR(50) DEFAULT '',
    anio INT DEFAULT NULL,
    estatus VARCHAR(30) DEFAULT 'disponible',
    vigencia_sct DATE DEFAULT NULL,
    vigencia_seguro DATE DEFAULT NULL,
    vigencia_mecanico DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Catálogo de Cajas
CREATE TABLE cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_caja VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(50) DEFAULT 'Seca 53ft',
    anio INT DEFAULT NULL,
    estatus VARCHAR(30) DEFAULT 'disponible',
    vigencia_sct DATE DEFAULT NULL,
    vigencia_mecanico DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Catálogo de Operadores
CREATE TABLE operadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_operador VARCHAR(30) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    licencia VARCHAR(50) DEFAULT '',
    vigencia_licencia DATE DEFAULT NULL,
    visa VARCHAR(50) DEFAULT '',
    vigencia_visa DATE DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT '',
    tractor_asignado VARCHAR(50) DEFAULT '', -- Relación lógica o FK a unidades(numero_economico)
    caja_asignada VARCHAR(50) DEFAULT '',    -- Relación lógica o FK a cajas(numero_caja)
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tipos de Movimiento
CREATE TABLE tipos_movimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cliente_asociado VARCHAR(150) DEFAULT 'NA', -- Filtrado lógico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Localidades (Orígenes y Destinos)
CREATE TABLE localidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'planta',
    estado VARCHAR(100) DEFAULT 'Chihuahua',
    pais VARCHAR(5) DEFAULT 'MX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Puentes y Tarifas de Peaje
CREATE TABLE peajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puente VARCHAR(100) NOT NULL,
    tarifa DECIMAL(10,2) NOT NULL,
    vigencia DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Catálogo de Precios y Tarifas por Cliente
CREATE TABLE precios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(150) NOT NULL,            -- FK a clientes(razon_social) o ID
    tipo_movimiento VARCHAR(100) NOT NULL,    -- FK a tipos_movimiento(nombre)
    pesos DECIMAL(10,2) DEFAULT NULL,
    dolares DECIMAL(10,2) DEFAULT NULL,       -- Tarifa base (USD)
    fecha_vigencia DATE DEFAULT NULL,         -- Control de trazabilidad de costos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bitácora de Movimientos (Operaciones de Viaje)
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    usuario VARCHAR(100) NOT NULL,             -- Usuario de super captura
    cliente VARCHAR(150) NOT NULL,             -- Relacionado a clientes
    tipo_mov VARCHAR(100) NOT NULL,            -- Relacionado a tipos_movimiento
    origen VARCHAR(150) NOT NULL,              -- Relacionado a localidades
    destino VARCHAR(150) NOT NULL,             -- Relacionado a localidades
    operador VARCHAR(150) NOT NULL,            -- Relacionado a operadores
    tractor VARCHAR(50) NOT NULL,              -- Relacionado a unidades
    caja VARCHAR(50) NOT NULL,                 -- Relacionado a cajas
    fac_pedimento VARCHAR(100) DEFAULT '',
    puente VARCHAR(100) DEFAULT '',
    num_voucher VARCHAR(100) DEFAULT '',
    peaje VARCHAR(50) DEFAULT '',
    sello VARCHAR(100) DEFAULT '',
    salio_origen TIME DEFAULT NULL,
    punto_revision VARCHAR(100) DEFAULT '',
    entrada_mx TIME DEFAULT NULL,
    salida_mx TIME DEFAULT NULL,
    entrada_am TIME DEFAULT NULL,
    salida_am TIME DEFAULT NULL,
    hora_entrega TIME DEFAULT NULL,
    estatus VARCHAR(50) DEFAULT 'Completo',
    cmt VARCHAR(50) DEFAULT '',
    factura VARCHAR(50) DEFAULT '',            -- Pre-factura o referencia final
    vale_fisico VARCHAR(50) NOT NULL,          -- Requerido obligatorio para cobro
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Catálogo de Cobranza (Facturas)
CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(50) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    monto DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha_emision DATE NOT NULL,
    dias_antiguedad INT DEFAULT 0,
    estatus VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'pagada', 'vencida'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Contrato de API (Endpoints JSON)

El backend de PHP debe exponer una API REST que acepte y devuelva formato JSON. A continuación se desglosan las principales rutas requeridas por el frontend:

### 2.1 Autocompletado de la "Súper Captura"
* **Endpoint:** `GET /api/operadores`
* **Descripción:** Devuelve la lista de operadores activos con su tractor y caja asignados por defecto.
* **Respuesta Esperada (JSON):**
```json
[
  {
    "id": 1,
    "numeroOperador": "OP-001",
    "nombreCompleto": "ALAN ROBLEDO",
    "tractorAsignado": "F01",
    "cajaAsignada": "40477",
    "activo": true
  }
]
```

### 2.2 Registrar Nuevo Viaje (Bitácora)
* **Endpoint:** `POST /api/movimientos`
* **Descripción:** Registra un nuevo movimiento en la bitácora desde la pantalla de "Súper Captura".
* **Cuerpo de la Petición (JSON):**
```json
{
  "fecha": "2026-07-08",
  "hora": "10:00",
  "usuario": "MARGARITA",
  "cliente": "DANHIL",
  "tipoMov": "INTERPLANTA",
  "origen": "DH2",
  "destino": "DH3",
  "operador": "ALAN ROBLEDO",
  "tractor": "F01",
  "caja": "40477",
  "sello": "SELLO-9921",
  "salioOrigen": "10:15",
  "valeFisico": "18992"
}
```
* **Respuesta Esperada (JSON):**
```json
{
  "status": "success",
  "message": "Movimiento registrado con éxito",
  "data": {
    "id": 7775
  }
}
```

### 2.3 Listar Movimientos (Filtro para Reporteador de Pre-Facturación)
* **Endpoint:** `GET /api/movimientos?cliente={cliente}&fecha_inicio={fecha_inicio}&fecha_fin={fecha_fin}`
* **Descripción:** Obtiene los viajes agrupados por las fechas dadas para generar los reportes de pre-factura.
* **Respuesta Esperada (JSON):**
```json
[
  {
    "id": 1,
    "fecha": "2026-06-01",
    "hora": "07:10",
    "usuario": "MIRIAM",
    "cliente": "DANHIL",
    "tipoMov": "INTERPLANTA",
    "origen": "DH2",
    "destino": "DH3",
    "operador": "URRUTIA EDGAR",
    "tractor": "L31",
    "caja": "4885",
    "valeFisico": "17749",
    "estatus": "Completo"
  }
]
```

### 2.4 Catálogo de Tarifas y Precios (Importación y Actualización)
* **Endpoint:** `GET /api/precios`
* **Descripción:** Obtiene las tarifas registradas por cliente y movimiento.
* **Respuesta Esperada (JSON):**
```json
[
  {
    "id": 1,
    "cliente": "ARES METAL",
    "tipoMovimiento": "EXPO PZ",
    "pesos": null,
    "dolares": 150.00,
    "fecha_vigencia": "2026-01-01"
  }
]
```

### 2.5 Gestión de Cobranza (Facturas)
* **Endpoint:** `GET /api/facturas`
* **Descripción:** Devuelve la lista de facturas de clientes para seguimiento de cobranza.
* **Respuesta Esperada (JSON):**
```json
[
  {
    "id": 1,
    "folio": "A1020",
    "cliente": "DANHIL",
    "monto": 15000.50,
    "fechaEmision": "2026-06-01",
    "diasAntiguedad": 14,
    "estatus": "pendiente"
  }
]
```

---

## 3. Lógica de Negocio y Recomendaciones de Transición

### 3.1 Mecanismo de Pre-Facturación (Evitar Manipulación del Cliente)
> [!IMPORTANT]
> El frontend actual procesa la sumatoria de costos cruzando los viajes con `precios.json` en tiempo de ejecución de la vista. Para la versión de producción, el backend en **PHP** debe calcular y asociar la tarifa vigente al viaje **en el momento en que se registra** o calcularlo en la consulta de base de datos (`JOIN` entre `movimientos` y `precios` filtrando por la fecha del viaje y vigencia). Esto previene que una alteración en el lado del cliente (Frontend) altere los montos de cobro de pre-factura.

### 3.2 Implementación de la Súper Captura
1. Al cargar la pantalla, el frontend realiza una petición `GET` a `/api/operadores`.
2. Cuando el usuario selecciona al **Operador**, el frontend llena los campos de **Tractor** y **Caja** automáticamente usando `tractorAsignado` y `cajaAsignada`.
3. El frontend mantiene las variables de Operador y Tractor fijadas (bloqueadas) localmente mediante el estado de la aplicación.
4. El campo **Caja** permanece libre para edición rápida en caso de que cambie de contenedor en el andén.

### 3.3 Importación de Tarifas desde Excel
* El desarrollador de backend debe proveer un endpoint `POST /api/precios/importar` que reciba un archivo `.xlsx` (enviado mediante un `FormData`).
* El script de PHP debe procesar el archivo usando librerías como **PhpSpreadsheet** para validar columnas obligatorias (`cliente`, `tipoMovimiento`, `tarifa_usd`, `fecha_vigencia`) e insertar o actualizar (`INSERT ... ON DUPLICATE KEY UPDATE` / `MERGE`) las tarifas en la base de datos.
