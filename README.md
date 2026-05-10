# Boxful Backend API

API REST construida con **NestJS**, **MongoDB** y **Prisma ORM** para la plataforma de envíos Boxful.

---

## 🚀 Tecnologías

- **Runtime:** Node.js 18+
- **Framework:** NestJS
- **Base de datos:** MongoDB
- **ORM:** Prisma
- **Autenticación:** JWT (JSON Web Tokens)
- **Documentación:** Swagger / OpenAPI

---

## 📋 Requisitos previos

- Node.js >= 18
- npm >= 9
- MongoDB (local o Atlas)

---

## 🐳 Instalación con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd boxful-backend

# 2. Copiar variables de entorno
cp .env.example .env
# Edita .env si quieres cambiar usuario/contraseña de Mongo o JWT_SECRET

# 3. Levantar todo (MongoDB + API + Seeder)
docker compose up --build
```

Eso es todo. Docker se encarga de:
- Levantar MongoDB con volumen persistente
- Construir y correr la API en NestJS
- Ejecutar el seeder automáticamente (costos de envío por día)

La API queda disponible en `http://localhost:3001`

---

### 🐳 Desarrollo con hot reload

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Monta el código fuente como volumen, los cambios se reflejan sin rebuild.

---

### ⚙️ Instalación sin Docker

```bash
# Requiere MongoDB corriendo localmente o una URL de Atlas

npm install
cp .env.example .env
# Editar DATABASE_URL en .env

npx prisma generate
npx prisma db push
npm run seed
npm run start:dev
```

---

## 🌍 Variables de entorno

```env
# .env.example
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/boxful"
JWT_SECRET="your_super_secret_key"
JWT_EXPIRES_IN="7d"
PORT=3001
```

---

## 📂 Estructura del proyecto

```
src/
├── auth/                  # Módulo de autenticación (JWT)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── orders/                # Módulo de órdenes
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── orders.module.ts
│   └── dto/
│       ├── create-order.dto.ts
│       ├── filter-orders.dto.ts
│       └── webhook-update.dto.ts
├── shipping-costs/        # Módulo de costos de envío
│   ├── shipping-costs.module.ts
│   └── shipping-costs.service.ts
├── settlement/            # Módulo de liquidación (punto extra)
│   ├── settlement.module.ts
│   └── settlement.service.ts
├── prisma/                # Servicio Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/                # Guards, decorators, interceptors
│   └── decorators/
│       └── current-user.decorator.ts
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma
seed/
└── seed.ts
```

---

## 🔑 Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Inicio de sesión |

### Orders
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/orders` | Crear orden | ✅ |
| GET | `/orders` | Listar órdenes (con filtros) | ✅ |
| GET | `/orders/:id` | Obtener orden por ID | ✅ |
| GET | `/orders/export/csv` | Exportar órdenes a CSV | ✅ |
| POST | `/orders/webhook/:id` | Webhook actualización de entrega | — |

### Settlement (Punto Extra)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/settlement` | Calcular liquidación del comercio | ✅ |

---

## 📦 Filtros disponibles en GET /orders

```
GET /orders?status=DELIVERED&startDate=2024-01-01&endDate=2024-12-31&search=Juan
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Estado de la orden |
| `startDate` | ISO string | Fecha desde |
| `endDate` | ISO string | Fecha hasta |
| `search` | string | Busca en nombre/email del destinatario |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20) |

---

## 🌱 Seeders

El seeder crea los costos base de envío por día de la semana en la base de datos:

```bash
npm run seed
```

Costos por defecto (editables directo en MongoDB):
| Día | Costo |
|-----|-------|
| Lunes | $5.00 |
| Martes | $5.00 |
| Miércoles | $5.00 |
| Jueves | $5.00 |
| Viernes | $6.00 |
| Sábado | $7.00 |
| Domingo | $8.00 |

---

## 📐 Reglas de Liquidación (Punto Extra)

- **Orden COD:** `Monto Recolectado - Costo de Envío - Comisión COD`
- **Comisión COD:** 0.01% del monto recolectado, tope máximo $25 USD
- **Orden sin cobro (No COD):** `-(Costo de Envío)` (valor negativo)

---

## 📖 Documentación Swagger

Una vez corriendo el servidor, accede a:

```
http://localhost:3001/api/docs
```

---

## 🧪 Esfuerzos extras

- Paginación en listado de órdenes
- Exportación a CSV
- Webhook para actualización de estado con monto real
- Módulo de liquidación con reglas de negocio COD
- Documentación completa con Swagger
- Seeders de costos de envío configurables por día
