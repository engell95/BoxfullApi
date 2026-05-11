# Boxful API - Sistema de Logística y Envíos

API profesional construida con **NestJS**, **Prisma ORM** y **MongoDB**, diseñada para gestionar la logística de envíos, liquidaciones financieras y autenticación multi-nivel.

## 🏗️ Arquitectura y Seguridad

La plataforma implementa un sistema de **Doble Capa de Autenticación**:
1. **App Token**: Requerido para inicializar la aplicación y registrar nuevos comercios.
2. **User Token**: Generado tras el login de usuario para acceder a datos privados de la empresa.

## 🚀 Funcionalidades Clave

- **Gestión de Órdenes**: CRUD completo con validación de costos según el día de la semana.
- **Módulo de Liquidación (Settlement)**: Cálculo dinámico del monto neto a pagar al comercio, deduciendo comisiones y costos de envío.
- **Sistema de Ubicaciones**: Catálogo de departamentos y municipios de Nicaragua para precisión en entregas.
- **Exportación CSV**: Endpoint optimizado para la generación de reportes masivos.
- **Validación Global**: Uso de Pipes para asegurar la integridad de los datos entrantes.

## 🛠️ Stack Tecnológico

- **Framework**: [NestJS](https://nestjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Seguridad**: JWT (Passport) + Bcrypt
- **Documentación**: Swagger (OpenAPI)

## ⚙️ Configuración del Entorno

1. **Clonar y configurar variables**:
   Renombra `.env.example` a `.env` y ajusta los valores de conexión a MongoDB.

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Inicializar Base de Datos (Seed)**:
   Este comando crea los parámetros de comisión, costos de envío y usuarios de prueba.
   ```bash
   npm run seed
   ```

4. **Levantar Servidor**:
   ```bash
   npm run start:dev
   ```

## 📍 Endpoints Principales

- `POST /auth/app-login`: Obtención de token de aplicación.
- `POST /auth/login`: Login de usuario (requiere App Token en Header).
- `GET /orders`: Listado filtrado de envíos.
- `GET /settlement`: Resumen financiero y monto a liquidar.
- `GET /locations`: Listado de departamentos y municipios.

## 🐳 Despliegue con Docker (Recomendado)

El proyecto incluye una configuración completa de Docker que levanta todo el ecosistema (Base de datos + API + Seeder).

### Componentes de la infraestructura:
- **boxful_mongo**: Instancia de MongoDB 7 configurada con un **Replica Set** (requerido por Prisma para transacciones).
- **boxful_api**: El servicio NestJS principal.
- **boxful_seeder**: Un contenedor efímero que sincroniza el esquema de Prisma y puebla la base de datos con los datos iniciales (costos, parámetros y usuarios de prueba).

### Pasos para iniciar:

1. **Configuración de Red**:
   Asegúrate de que los puertos `3001` (API) y `27017` (Mongo) estén disponibles.

2. **Levantar el ecosistema**:
   ```bash
   docker-compose up --build
   ```
   *Nota: En la primera ejecución, verás que `boxful_seeder` realiza el proceso de `db push` y `seed`. Una vez terminado, el contenedor se detendrá automáticamente con éxito.*

3. **Comandos Útiles**:
   - **Ver logs**: `docker-compose logs -f api`
   - **Detener todo**: `docker-compose down`
   - **Limpiar volúmenes**: `docker-compose down -v` (Borrara los datos de la DB)
   - **Re-ejecutar Seeder**: `docker-compose start seeder`

---
