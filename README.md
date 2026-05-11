# Boxful Backend API

API REST construida con **NestJS**, **MongoDB** y **Prisma ORM** para la plataforma de envíos Boxful.

---

## 🚀 Tecnologías

- **Runtime:** Node.js 18+
- **Framework:** NestJS
- **Base de datos:** MongoDB
- **ORM:** Prisma
- **Autenticación:** JWT (Doble capa: App Token y User Token + Refresh Tokens)
- **Documentación:** Swagger / OpenAPI

---

## 🏗️ Arquitectura Técnica y Estándares

El backend ha sido diseñado siguiendo estándares de la industria para garantizar seguridad, escalabilidad y una integración limpia con clientes web y móviles:

### 1. Manejo de Errores Estandarizado (RFC 9457)
La API implementa el estándar **RFC 9457 (Problem Details for HTTP APIs)**. Cualquier excepción (errores de validación de DTOs, problemas de autenticación o caídas del servidor) es interceptada por un filtro global y formateada en el tipo de contenido `application/problem+json`.
Esto permite a los clientes consumir una estructura de error predecible y universal:
```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "recipientEmail must be an email",
  "instance": "/api/v1/orders",
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

### 2. Autenticación B2B de Doble Capa (Client Auth & User Auth)
Se implementó un patrón de seguridad de dos niveles para evitar accesos no autorizados a las vías de registro y logueo:
- **App Token (Client Credentials):** El frontend (o aplicación cliente) debe primero autenticarse enviando un `APP_ID` y `APP_SECRET` para obtener un Token de Aplicación. Este token es el único que da permisos para ejecutar el registro (`/auth/register`) o inicio de sesión (`/auth/login`).
- **User Token:** Una vez el usuario inicia sesión con éxito, la API emite el token final del usuario.

### 3. Ciclo de Vida de Tokens (Access & Refresh Tokens)
Para evitar la vulnerabilidad de emitir tokens de vida infinita, se implementó el estándar de Refresh Tokens:
- **Access Token:** Tiene una vida muy corta (ej. 15 minutos). Es el token que acompaña a todas las peticiones a la API.
- **Refresh Token:** Tiene una vida más larga (ej. 7 días). Su único propósito es ser enviado al endpoint `/auth/refresh` para generar un nuevo par de tokens una vez que el Access Token ha expirado, permitiendo mantener la sesión activa de forma segura y transparente para el usuario final.

### 4. Trazabilidad y Logs Híbridos (Winston)
Se integró **Winston** como motor principal para el registro de eventos y errores, configurado con múltiples vías de salida (Transports):
- **Consola:** Logs a color para el desarrollo en tiempo real.
- **Rotación de Archivos:** Las advertencias y errores se guardan en la carpeta `/logs`, generando un archivo nuevo por día para evitar saturar el disco.
- **Base de Datos:** Los errores críticos (HTTP 500) se inyectan automáticamente en la colección `system_logs` de MongoDB para permitir monitoreo profundo sin necesidad de acceder a los archivos del servidor.

---

## 📋 Requisitos previos

- Node.js >= 18
- npm >= 9
- MongoDB (local o Atlas)
- Docker Desktop (Opcional, pero recomendado)

---

## 🐳 Instalación con Docker (recomendado)

Es la forma más rápida de probar el proyecto ya que levanta la base de datos automáticamente.

1. Clona el repositorio y asegúrate de tener un archivo `.env` en la raíz (puedes copiar el contenido de `.env.example`).
2. Ejecuta el comando para levantar los servicios:
   ```bash
   docker-compose up --build -d
   ```
3. Docker se encargará de:
   - Levantar MongoDB con volumen persistente.
   - Construir y correr la API de NestJS.
   - Ejecutar el seeder (`npm run seed`) automáticamente para llenar la BD con parámetros, usuarios base, órdenes y ubicaciones de Nicaragua.

La API quedará disponible en `http://localhost:3001` y Swagger en `http://localhost:3001/api/docs`.

---

## ⚙️ Instalación sin Docker (Modo Local)

Si prefieres correrlo localmente sin Docker, necesitas tener un MongoDB corriendo (Local o Atlas).

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Modifica tu archivo `.env` para que la variable `DATABASE_URL` apunte a tu MongoDB (Descomenta la línea `# DATABASE_URL=mongodb://localhost:27017/boxful`).
3. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```
4. Ejecuta el Seeder para poblar la BD:
   ```bash
   npm run seed
   ```
5. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run start:dev
   ```

---

## 🌍 Variables de entorno (`.env`)

```env
PORT=3001
JWT_SECRET=boxful_super_secret_dev_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Credenciales para el App Token
APP_ID=boxful-frontend
APP_SECRET=secret123

# MongoDB
MONGO_USER=boxful
MONGO_PASSWORD=boxful123
MONGO_DB=boxful
DATABASE_URL=mongodb://boxful:boxful123@mongo:27017/boxful?authSource=admin
```

---

## 🔑 Flujo de Autenticación y Seguridad

La aplicación está protegida globalmente. El único endpoint 100% público es el **App Login**:

1. **Obtener App Token**: Llama a `POST /auth/app-login` enviando `appId` y `appSecret`. Recibirás un Token de Aplicación.
2. **Login/Registro**: Usa ese App Token como Bearer Auth para poder consumir `POST /auth/login` o `POST /auth/register`. 
3. **User Token**: El login te devolverá un Token de Usuario (Access y Refresh). Usa este User Access Token para todas las demás rutas.
4. **Refresh Token**: Cuando el Access Token expire (15 min), usa `POST /auth/refresh` enviando tu Refresh Token para obtener uno nuevo.

---

## 🛣️ Endpoints Principales

Puedes probar todos estos endpoints directamente desde Swagger: `http://localhost:3001/api/docs`

### Auth
| Método | Ruta | Descripción | Auth Requerido |
|--------|------|-------------|----------------|
| POST | `/auth/app-login` | Genera Token de Aplicación | ❌ Público |
| POST | `/auth/refresh` | Refresca Tokens | ❌ Público |
| POST | `/auth/register` | Registro de usuario | 🛡️ App Token |
| POST | `/auth/login` | Inicio de sesión | 🛡️ App Token |

### Orders
| Método | Ruta | Descripción | Auth Requerido |
|--------|------|-------------|----------------|
| POST | `/orders` | Crear orden | ✅ User Token |
| GET | `/orders` | Listar órdenes (con filtros) | ✅ User Token |
| GET | `/orders/:id` | Obtener orden por ID | ✅ User Token |
| GET | `/orders/export/csv` | Exportar órdenes a CSV | ✅ User Token |
| POST | `/orders/webhook/:id`| Webhook actualización de entrega | ❌ Público |

### Locations (Nicaragua)
| Método | Ruta | Descripción | Auth Requerido |
|--------|------|-------------|----------------|
| GET | `/locations/departments` | Listar departamentos | ✅ User Token |
| GET | `/locations/departments/:id/municipalities` | Listar municipios | ✅ User Token |

### Settlement
| Método | Ruta | Descripción | Auth Requerido |
|--------|------|-------------|----------------|
| GET | `/settlement` | Calcular liquidación del comercio | ✅ User Token |

---

## 📐 Reglas de Liquidación

Los parámetros de liquidación viven en la base de datos y pueden ser editados dinámicamente sin tocar código.
- **Orden COD:** `Monto Recolectado - Costo de Envío - Comisión COD`
- **Comisión COD:** Configurable (por defecto 0.01% del monto recolectado, tope máximo $25 USD)
- **Orden sin cobro (No COD):** `-(Costo de Envío)` (valor negativo)
