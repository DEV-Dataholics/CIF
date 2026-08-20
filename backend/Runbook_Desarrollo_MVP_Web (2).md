# Runbook General: Crear una Aplicación Web MVP con Antigravity
## Dataholics Hybrid Stack — Proceso Replicable

> **Para qué sirve:** Guía estándar para crear cualquier aplicación web interna o externa
> desde cero usando Antigravity como asistente de desarrollo.
> Aplica para sistemas de gestión, portales de clientes, herramientas internas, etc.
>


---

## Stack Estándar Dataholics

| Capa | Tecnología |
|---|---|
| Backend API | CodeIgniter 4 (PHP 8.1+) |
| Frontend | HTML5 + Alpine.js + Tailwind CSS |
| Base de datos | MySQL |
| Hosting | Site5 / cPanel (Shared Hosting) |
| Deploy | Script Python via FTP |

---

## Antes de empezar — Insumos requeridos

Define estos puntos **antes** de abrir Antigravity:

### Del negocio
- [ ] **Nombre del sistema** — ¿Cómo se llama la aplicación?
- [ ] **Problema que resuelve** — ¿Qué hace el sistema en una oración?
- [ ] **Actores** — ¿Quiénes lo usan? (roles: admin, operador, cliente, etc.)
- [ ] **Entidades principales** — ¿Cuáles son los "sustantivos" del dominio? (pedidos, tickets, reportes, pagos, etc.)
- [ ] **Flujos críticos** — ¿Cuáles son los "verbos"? (crear, aprobar, asignar, cerrar, exportar, etc.)
- [ ] **Estados de la entidad principal** — ¿Por qué estados pasa? (ej: Borrador → Activo → Cerrado)

### Del servidor (configurar en cPanel antes de codificar)
- [ ] Subdominio o dominio creado y apuntando al document root correcto
- [ ] Base de datos MySQL creada con usuario y contraseña
- [ ] Cuenta FTP creada para el subdominio/dominio
- [ ] FTP Server anotado desde cPanel → FTP Accounts → **Manual Settings**

> **Importante:** El FTP Server en Site5 siempre es `ftp.tudominio.com`.
> No uses el dominio raíz directamente o la conexión fallará.

---

## PASO 0 — Configurar el servidor (cPanel)

Ejecuta estos pasos **una sola vez por proyecto** antes de llamar a Antigravity:

### 0.1 Base de datos
1. cPanel → **MySQL Databases**
2. Crear base de datos: recomendado `[prefix]_[nombreproyecto]`
3. Crear usuario MySQL con contraseña fuerte
4. Asignar usuario a la DB con **All Privileges**
5. Anotar: `hostname`, `database`, `usuario`, `contraseña`

### 0.2 Subdominio o dominio
1. cPanel → **Subdomains** (o **Addon Domains**)
2. Crear el dominio/subdominio
3. Anotar el **Document Root exacto** que cPanel asigna

### 0.3 Cuenta FTP
1. cPanel → **FTP Accounts**
2. Crear usuario FTP con directorio = Document Root del paso anterior
3. Anotar desde **Manual Settings**: FTP Server, usuario completo, contraseña

---

## PASO 1 — Prompt inicial a Antigravity

Abre una **conversación nueva** y envía este prompt.
Reemplaza todo lo que está en `[CORCHETES]`:

---

```
Necesito desarrollar una aplicación web para [DESCRIPCIÓN DEL PROBLEMA].

NOMBRE DEL SISTEMA: [NOMBRE]
CARPETA LOCAL: [RUTA COMPLETA EN TU EQUIPO]
DOMINIO/URL: [URL DEL SERVIDOR]

ACTORES Y ROLES:
[Lista cada rol y qué puede hacer]
Ejemplo:
- Administrador: gestión total de usuarios y entidades
- Operador: procesar y actualizar registros
- Cliente: crear solicitudes y consultar su estado

ENTIDADES PRINCIPALES:
[Lista las entidades (tablas) principales con sus campos clave]
Ejemplo:
- Empresa: nombre, tipo, estado
- Usuario: nombre, email, contraseña, rol, empresa
- [Entidad principal]: campo1, campo2, estado, prioridad, creador

ESTADOS DE [ENTIDAD PRINCIPAL]:
[Estado inicial] → [Estado 2] → [Estado 3] → [Estado final]

FLUJOS PRINCIPALES:
1. [Actor] puede [acción] un/una [entidad]
2. [Actor] puede cambiar el estado de [entidad] a [estado]
3. [Actor] solo puede ver [entidades] de su [scope]

REGLAS DE NEGOCIO:
- [Regla 1: ej. Un cliente solo ve sus propias solicitudes]
- [Regla 2: ej. Solo el admin puede eliminar registros]
- [Regla 3: ej. Al pasar al estado "cerrado" se guarda la fecha de cierre]

SEGURIDAD:
- Autenticación por sesión PHP (cookies HttpOnly)
- RBAC por rol en cada endpoint
- Aislamiento de datos por empresa/tenant si aplica

STACK TÉCNICO (Dataholics Hybrid Stack):
- Backend: CodeIgniter 4 (API REST)
- Frontend: HTML estático + Alpine.js + Tailwind CSS
- Base de datos: MySQL
- Hosting: Site5 (shared hosting cPanel)
- Estructura: api/ para backend, public_html/ para frontend

Por favor, presenta el plan de implementación antes de generar código.
```

---

**Tip:** Entre más detallado sea el prompt, más preciso será el plan.
Si algo no está claro, escríbelo como pregunta dentro del prompt y Antigravity lo resolverá.

---

## PASO 2 — Revisar y aprobar el plan

Antigravity presentará fases de desarrollo, archivos a crear y schema de la DB.

**Tu respuesta:** `continua` — o ajusta lo que no coincida con tu visión antes de aprobar.

---

## PASO 3 — Proveer credenciales de base de datos

Cuando Antigravity las solicite, responde así:

```
mysql:
  hostname: localhost
  database: [nombre_database]
  username: [usuario_mysql]
  password: [contraseña]
```

Antigravity configurará `api/.env` automáticamente.

---

## PASO 4 — Instalar CodeIgniter 4

Si Antigravity te lo indica:

1. Ve a: https://github.com/codeigniter4/framework/releases
2. Descarga el ZIP de la última versión estable
3. Extrae el contenido dentro de la carpeta `api/` del proyecto
4. Confirma a Antigravity: `listo`

---

## PASO 5 — Generación del backend

Antigravity generará en orden: rutas, filtros, controladores y schema SQL.
Tu rol es **revisar y aprobar** cada archivo con: `continua`

**Al recibir el `database.sql`:**
1. cPanel → phpMyAdmin → selecciona tu DB → pestaña SQL
2. Pega y ejecuta el contenido
3. Confirma a Antigravity que la DB está lista

---

## PASO 6 — Generación del frontend

Antigravity generará vistas HTML para cada rol.
Si falta alguna funcionalidad, indícala: `"falta la pantalla de [nombre]"`

**Tu respuesta entre archivos:** `continua`

---

## PASO 7 — Deploy al servidor

### 7.1 Solicitar preparación para producción
```
prepara el deploy al servidor, el dominio es: [URL]
```

### 7.2 Proveer credenciales FTP
Comparte la captura de **Manual Settings** en cPanel → FTP Accounts, o escribe:
```
FTP Server: ftp.[dominio]
Usuario: [usuario]@[dominio]
Contraseña: [contraseña]
Directorio: [document root]
```

### 7.3 Aprobar el comando de deploy
```
python deploy_ftp.py
```

> **Error frecuente:** Si el FTP falla, verifica que el host sea `ftp.dominio.com`
> y que la ruta del directorio en el servidor sea la correcta (consultar File Manager de cPanel).

---

## PASO 8 — Crear el primer usuario administrador

El archivo `setup_admin.php` fue subido automáticamente al servidor.

**Sin Terminal en cPanel** (caso más común en Site5):
```
https://[tu-dominio]/setup_admin.php?token=[TOKEN]
```
El token lo genera Antigravity. Las credenciales aparecen en pantalla.

> **Obligatorio:** Eliminar `setup_admin.php` del servidor inmediatamente después.
> cPanel → File Manager → buscar el archivo → Delete.

---

## PASO 9 — Validación E2E

Pide a Antigravity:
```
haz una prueba end-to-end: crea un usuario de prueba, ejecuta el flujo
principal y verifica que todo funciona correctamente
```

Antigravity navegará el sistema con su agente de browser y reportará resultados.
Si algo falla, describe exactamente lo que ves y Antigravity lo corregirá.

---

## Resolución de errores frecuentes

| Lo que ves | Causa | Qué decirle a Antigravity |
|---|---|---|
| `403` en la URL raíz | `.htaccess` muy restrictivo | "tengo 403 en la raíz del dominio" |
| `403` al llamar al API | `.htaccess` bloquea rutas virtuales | "el endpoint /api/… devuelve 403" |
| `404` después del login | URL de redirección no existe | "después del login lleva a una 404" |
| FTP no conecta | Host FTP incorrecto | "FTP falla" + captura de Manual Settings |
| Archivos en ruta incorrecta | Rutas absolutas con FTP chrooteado | captura del File Manager con la estructura real |
| PHP visible sin ejecutar | PHP no activo en ese dominio | "el servidor muestra código PHP sin ejecutarlo" |
| Error 500 sin detalle | Modo `production` oculta errores | "500 sin detalle, activa modo development" |
| Sesión no persiste | Permisos en `writable/session/` | "la sesión no se mantiene entre páginas" |

---

## Checklist final

### Seguridad
- [ ] `setup_admin.php` eliminado del servidor
- [ ] `.env` no está en Git (verificar `.gitignore`)
- [ ] `api/` no es accesible directamente vía browser
- [ ] Cookies son HttpOnly (DevTools → Application → Cookies)

### Funcionalidad
- [ ] Login funciona para todos los roles
- [ ] Cada rol ve solo lo que debe ver
- [ ] El flujo principal funciona de inicio a fin

### Servidor
- [ ] Sitio carga en `https://[dominio]`
- [ ] Permisos de `api/writable/` son `755`
- [ ] `.env` tiene `CI_ENVIRONMENT = production`

---

## Tiempo estimado

| Etapa | Tiempo típico |
|---|---|
| Configuración cPanel | 15–30 min |
| Prompt + aprobación del plan | 5–10 min |
| Generación backend (Antigravity) | 10–20 min |
| Generación frontend (Antigravity) | 10–20 min |
| Deploy y configuración servidor | 10–30 min |
| Resolución de errores de servidor | 15–45 min |
| Prueba E2E | 5–10 min |
| **Total** | **~1.5 a 3 horas** |

---

*Dataholics Development Standards — 2026*
*Ver también: `MVP_Development_Guideline.md` · `Tech_Stack_Guideline.md`*
