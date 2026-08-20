-- ============================================================
-- CIF LOGÍSTICA MVP — Schema MySQL Completo
-- Versión: 1.0.0 | Compatible: MySQL 8.0+
-- Importar en phpMyAdmin o MySQL CLI
-- NOTA: Los datos de demo se insertan con CifDemoSeeder (PHP)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `cif_logistica`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `cif_logistica`;

-- ── 1. Usuarios ──────────────────────────────────────────────
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nombre`        VARCHAR(100) NOT NULL,
  `email`         VARCHAR(150) NOT NULL,
  `password`      VARCHAR(255) NOT NULL,
  `rol`           ENUM('admin','trafico','operador','facturacion','taller','porteria') NOT NULL,
  `activo`        TINYINT(1) DEFAULT 1,
  `ultimo_acceso` DATETIME NULL,
  `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Clientes (maquiladoras) ───────────────────────────────
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `razon_social`       VARCHAR(200) NOT NULL,
  `tipo`               ENUM('maquiladora','distribuidor','general') DEFAULT 'maquiladora',
  `contacto_email`     VARCHAR(150) NULL,
  `correo_solicitudes` VARCHAR(150) NULL,
  `tipo_facturacion`   ENUM('nacional','usa','ambos') DEFAULT 'nacional',
  `precio_cartaporte`  DECIMAL(10,2) DEFAULT 0.00,
  `tarifa_tiempo_extra`DECIMAL(10,2) DEFAULT 0.00,
  `activo`             TINYINT(1) DEFAULT 1,
  `created_at`         DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Operadores ────────────────────────────────────────────
DROP TABLE IF EXISTS `operadores`;
CREATE TABLE `operadores` (
  `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nombre_completo`         VARCHAR(150) NOT NULL,
  `numero_operador`         VARCHAR(20)  NOT NULL,
  `telefono`                VARCHAR(20)  NULL,
  `licencia_mx`             VARCHAR(50)  NULL,
  `licencia_mx_vencimiento` DATE         NULL,
  `licencia_usa`            VARCHAR(50)  NULL,
  `licencia_usa_vencimiento`DATE         NULL,
  `fecha_ingreso`           DATE         NULL,
  `activo`                  TINYINT(1)   DEFAULT 1,
  `usuario_id`              INT UNSIGNED NULL,
  `created_at`              DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_num_op` (`numero_operador`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Tractocamiones ────────────────────────────────────────
DROP TABLE IF EXISTS `tractocamiones`;
CREATE TABLE `tractocamiones` (
  `id`                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `numero_economico`     VARCHAR(20)  NOT NULL,
  `marca`                VARCHAR(50)  NULL,
  `modelo`               VARCHAR(50)  NULL,
  `anio`                 SMALLINT     NULL,
  `placas_mx`            VARCHAR(20)  NULL,
  `placas_usa`           VARCHAR(20)  NULL,
  `permiso_sct`          VARCHAR(50)  NULL,
  `vencimiento_sct`      DATE         NULL,
  `poliza_mx`            VARCHAR(50)  NULL,
  `vencimiento_poliza_mx`DATE         NULL,
  `poliza_usa`           VARCHAR(50)  NULL,
  `vencimiento_poliza_usa` DATE       NULL,
  `operador_asignado_id` INT UNSIGNED NULL,
  `estatus`              ENUM('disponible','en_ruta','en_taller','fuera_base') DEFAULT 'disponible',
  `rendimiento_objetivo` DECIMAL(6,2) DEFAULT 3.50 COMMENT 'km/litro objetivo',
  `created_at`           DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_economico` (`numero_economico`),
  FOREIGN KEY (`operador_asignado_id`) REFERENCES `operadores`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Cajas (trailers) ──────────────────────────────────────
DROP TABLE IF EXISTS `cajas`;
CREATE TABLE `cajas` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `numero_caja`        VARCHAR(20)  NOT NULL,
  `tipo`               ENUM('local','foranea') DEFAULT 'local',
  `placas_mx`          VARCHAR(20)  NULL,
  `placas_usa`         VARCHAR(20)  NULL,
  `ubicacion_actual`   VARCHAR(200) NULL,
  `estatus`            ENUM('disponible','en_viaje','en_cliente','prestada','en_taller') DEFAULT 'disponible',
  `cliente_asignado_id`INT UNSIGNED NULL,
  `activo`             TINYINT(1)   DEFAULT 1,
  `created_at`         DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_num_caja` (`numero_caja`),
  FOREIGN KEY (`cliente_asignado_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Viajes ────────────────────────────────────────────────
DROP TABLE IF EXISTS `viajes`;
CREATE TABLE `viajes` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `cliente_id`      INT UNSIGNED  NULL,
  `operador_id`     INT UNSIGNED  NOT NULL,
  `tractocamion_id` INT UNSIGNED  NOT NULL,
  `caja_id`         INT UNSIGNED  NULL,
  `tipo_movimiento` ENUM('local_cargado','local_vacio','recoleccion','interplanta',
                         'exportacion','importacion','rampa','reparto') NOT NULL,
  `origen`          VARCHAR(200)  NOT NULL,
  `destino`         VARCHAR(200)  NOT NULL,
  `via_cruce`       VARCHAR(100)  NULL,
  `folio_boleta`    VARCHAR(50)   NULL,
  `fecha_salida`    DATETIME      NULL,
  `fecha_llegada`   DATETIME      NULL,
  `estatus`         ENUM('solicitado','asignado','en_transito','en_aduana',
                         'entregado','documentado','facturado') DEFAULT 'solicitado',
  `foto_voucher`    VARCHAR(500)  NULL COMMENT 'ruta relativa del archivo',
  `notas`           TEXT          NULL,
  `puntos_asignados`INT           DEFAULT 0,
  `created_by`      INT UNSIGNED  NULL,
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_estatus` (`estatus`),
  INDEX `idx_operador` (`operador_id`),
  INDEX `idx_tracto` (`tractocamion_id`),
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`operador_id`) REFERENCES `operadores`(`id`),
  FOREIGN KEY (`tractocamion_id`) REFERENCES `tractocamiones`(`id`),
  FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Puntos Operador (gamificación) ────────────────────────
DROP TABLE IF EXISTS `puntos_operador`;
CREATE TABLE `puntos_operador` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `operador_id`   INT UNSIGNED NOT NULL,
  `viaje_id`      INT UNSIGNED NULL,
  `puntos_ganados`INT          NOT NULL DEFAULT 0,
  `tipo_evento`   ENUM('viaje_cargado','viaje_vacio','rampa',
                       'limpieza_tracto','limpieza_caja','bono_especial') NOT NULL,
  `fecha_registro`DATETIME DEFAULT CURRENT_TIMESTAMP,
  `semana`        TINYINT UNSIGNED NOT NULL COMMENT 'Semana del año ISO',
  `anio`          SMALLINT UNSIGNED NOT NULL,
  INDEX `idx_op_semana` (`operador_id`, `anio`, `semana`),
  FOREIGN KEY (`operador_id`) REFERENCES `operadores`(`id`),
  FOREIGN KEY (`viaje_id`) REFERENCES `viajes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Solicitudes Taller (SOS) ──────────────────────────────
DROP TABLE IF EXISTS `solicitudes_taller`;
CREATE TABLE `solicitudes_taller` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tractocamion_id`  INT UNSIGNED NOT NULL,
  `operador_id`      INT UNSIGNED NOT NULL,
  `problema`         TEXT         NOT NULL,
  `urgencia`         ENUM('baja','media','alta','sos') DEFAULT 'media',
  `puede_operar`     TINYINT(1)   DEFAULT 1 COMMENT '0 = requiere grúa',
  `estatus`          ENUM('pendiente','en_proceso','resuelto','cancelado') DEFAULT 'pendiente',
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tractocamion_id`) REFERENCES `tractocamiones`(`id`),
  FOREIGN KEY (`operador_id`) REFERENCES `operadores`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Órdenes Servicio Taller ───────────────────────────────
DROP TABLE IF EXISTS `ordenes_servicio_taller`;
CREATE TABLE `ordenes_servicio_taller` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solicitud_id`        INT UNSIGNED NULL,
  `tractocamion_id`     INT UNSIGNED NOT NULL,
  `tipo`                ENUM('preventivo','correctivo','neumaticos','hojalateria','otro') DEFAULT 'correctivo',
  `descripcion`         TEXT         NOT NULL,
  `mecanico_responsable`VARCHAR(100) NULL,
  `fecha_inicio`        DATETIME     NULL,
  `fecha_fin`           DATETIME     NULL,
  `costo_estimado`      DECIMAL(10,2) DEFAULT 0.00,
  `costo_real`          DECIMAL(10,2) DEFAULT 0.00,
  `estatus`             ENUM('abierta','en_proceso','terminada','cancelada') DEFAULT 'abierta',
  `created_at`          DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes_taller`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`tractocamion_id`) REFERENCES `tractocamiones`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. Bitácora Portería ────────────────────────────────────
DROP TABLE IF EXISTS `bitacora_porteria`;
CREATE TABLE `bitacora_porteria` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tractocamion_id`  INT UNSIGNED NULL,
  `caja_id`          INT UNSIGNED NULL,
  `operador_id`      INT UNSIGNED NULL,
  `tipo_movimiento`  ENUM('entrada','salida') NOT NULL,
  `destino_origen`   VARCHAR(200) NULL,
  `sello_caja`       VARCHAR(100) NULL,
  `observaciones`    TEXT         NULL,
  `registrado_por`   INT UNSIGNED NULL,
  `fecha_hora`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fecha` (`fecha_hora`),
  FOREIGN KEY (`tractocamion_id`) REFERENCES `tractocamiones`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`operador_id`) REFERENCES `operadores`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Para insertar datos de demo, ejecutar después de instalar CI4:
--   php api/spark db:seed CifDemoSeeder
-- Contraseña de todos los usuarios demo: cif2026
-- ============================================================

-- ============================================================
-- CIF MySQL Patch for phpMyAdmin import
-- Adds DB session table and default admin user
-- Default admin password: cif2026
-- ============================================================

CREATE TABLE IF NOT EXISTS `ci_sessions` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data` blob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ci_sessions_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `clientes`
  MODIFY `tipo` ENUM('maquiladora','distribuidor','general','comercial') DEFAULT 'maquiladora';

INSERT INTO `usuarios` (`nombre`, `email`, `password`, `rol`, `activo`)
VALUES ('Admin CIF', 'admin@cif.mx', '$2y$12$oiKoQkYVYLTW7yI6ifa/JOthL0bz1uKTUFppX0di5cTHgpAeED8e2', 'admin', 1)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `rol` = 'admin',
  `activo` = 1;
