# 👡 Dassel Sandals - Sistema de Gestión y Punto de Venta

Sistema integral para el control de inventario, gestión de catálogo de productos, registro de clientes y procesamiento de ventas (POS) para la tienda de calzado Dassel Sandals.

---

## 📋 Tabla de Contenidos
- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración e Instalación](#-configuración-e-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Endpoints Principales (API REST)](#-endpoints-principales-api-rest)
- [Flujo de Trabajo y Despliegue](#-flujo-de-trabajo-y-despliegue)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 📝 Descripción General

Dassel Sandals es una solución tecnológica diseñada para optimizar y automatizar los procesos operativos y comerciales de la tienda. El sistema permite administrar de forma centralizada el inventario de calzado, gestionar los precios y variaciones por talla o color, acelerar el proceso de facturación en el punto de venta y generar reportes financieros detallados para la toma de decisiones.

---

## ✨ Características Principales

* 🏷️ Gestión de Calzado y Catálogo: Registro, edición y clasificación de productos por modelo, categoría, talla, color y precio.
* 📦 Control de Inventario: Monitoreo en tiempo real de stock disponible, alertas de bajo stock y registro de entradas y salidas de mercancía.
* 💵 Punto de Venta (POS): Módulo ágil para procesamiento de ventas, facturación y emisión de comprobantes de pago.
* 👥 Gestión de Usuarios y Roles: Control de acceso mediante roles con permisos diferenciados (Administrador, Vendedor / Cajero).
* 📊 Reportes y Métricas: Visualización de ventas diarias, ingresos del período, historial de transacciones y productos más vendidos.

---

## 🛠️ Stack Tecnológico

### Frontend
* Framework / Librería: React (con Vite) / Next.js
* Estilos & UI: CSS3 / Tailwind CSS / Bootstrap
* Estado & Peticiones: Axios / TanStack Query (React Query)

### Backend
* Entorno de Ejecución: Node.js
* Framework: NestJS / Express.js
* Base de Datos & ORM: SQL Server / PostgreSQL con Prisma ORM (o TypeORM)
* Autenticación: JSON Web Tokens (JWT) & bcrypt para encriptación

### Herramientas & Entorno
* Control de Versiones: Git & GitHub
* Gestor de Paquetes: npm / yarn / pnpm

---

## 📁 Estructura del Proyecto

Dassel-Sandals-Proyecto/
├── client/                  # Aplicación Frontend
│   ├── src/
│   │   ├── assets/          # Imágenes, íconos y estilos globales
│   │   ├── components/      # Componentes UI reutilizables
│   │   ├── context/         # Estado global de la aplicación
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Vistas y pantallas principales
│   │   └── services/        # Cliente HTTP y llamadas a la API REST
│   └── package.json
│
├── server/                  # Aplicación Backend
│   ├── src/
│   │   ├── controllers/     # Controladores de la API (manejo de peticiones)
│   │   ├── middlewares/     # Middlewares de autenticación, roles y validación
│   │   ├── models/          # Modelos de datos / Schemas
│   │   ├── routes/          # Definición de rutas y endpoints
│   │   └── utils/           # Utilidades, helpers y constantes
│   ├── prisma/              # Esquema de base de datos y migraciones
│   └── package.json
│
├── .gitignore               # Archivos ignorados por Git
└── README.md                # Documentación principal del proyecto

---

## ⚙️ Requisitos Previos

Antes de comenzar con la instalación y ejecución del proyecto, asegúrate de contar con los siguientes elementos instalados en tu sistema:

* Node.js (Versión 18.x o superior)
* Gestor de paquetes npm (incluido con Node.js), yarn o pnpm
* Motor de Base de Datos activo (SQL Server, PostgreSQL o MySQL)
* Git instalado para el control de versiones

---

## 🚀 Configuración e Instalación

Sigue estos pasos para levantar el entorno de desarrollo local:

1. Clonar el Repositorio:
   git clone https://github.com/Perryman09/Dassel-Sandals-Proyecto.git
   cd Dassel-Sandals-Proyecto

2. Instalación de Dependencias:
   - Para el Backend:
     cd server
     npm install

   - Para el Frontend:
     cd ../client
     npm install

3. Configuración de Variables de Entorno:
   Crea un archivo .env en la raíz del proyecto o dentro de la carpeta del servidor (server/) tomando como referencia la sección de Variables de Entorno.

4. Ejecución de Migraciones de Base de Datos:
   # Desde la carpeta del backend
   npx prisma migrate dev

5. Iniciar la Aplicación en Desarrollo:
   - Servidor Backend:
     cd server
     npm run dev

   - Cliente Frontend:
     cd client
     npm run dev

---

## 🔐 Variables de Entorno

Crea un archivo .env en el servidor con la siguiente estructura base:

PORT=4000
DATABASE_URL="postgresql://usuario:password@localhost:5432/dassel_sandals_db?schema=public"
JWT_SECRET=tu_clave_secreta_jwt_super_segura
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173

---

## 📜 Scripts Disponibles

- npm run dev: Inicia el servidor o cliente en modo desarrollo con recarga en vivo
- npm run build: Compila el proyecto para producción en la carpeta dist/ o build/
- npm run start: Inicia el servidor compilado listo para entorno de producción
- npx prisma studio: Abre una interfaz web gráfica para explorar y editar la base de datos
- npx prisma migrate dev: Aplica las migraciones de esquemas pendientes a la base de datos

---

## 📡 Endpoints Principales (API REST)

### 🔑 Autenticación (/api/auth)
* POST /api/auth/login - Inicio de sesión y generación del token JWT.
* POST /api/auth/register - Registro de nuevos usuarios o empleados.

### 👡 Productos y Catálogo (/api/products)
* GET /api/products - Obtener lista completa de calzado/productos.
* GET /api/products/:id - Consultar detalles de un producto por ID.
* POST /api/products - Crear un nuevo producto en catálogo (Requiere Rol Admin).
* PUT /api/products/:id - Actualizar información o stock de un producto (Admin).
* DELETE /api/products/:id - Eliminar o desactivar un producto (Admin).

### 📦 Inventario (/api/inventory)
* GET /api/inventory/stock - Consultar niveles de stock actuales y alertas.
* PATCH /api/inventory/adjust - Ajuste manual de entradas o salidas de mercancía.

### 💵 Ventas y Punto de Venta (/api/sales)
* POST /api/sales - Registrar una nueva transacción de venta (POS).
* GET /api/sales - Consultar historial general de ventas.
* GET /api/sales/:id - Obtener el detalle de una factura o comprobante específico.
* GET /api/sales/reports/daily - Generar reporte de ingresos diarios.

---

## 🛠️ Flujo de Trabajo y Despliegue

1. Toda nueva funcionalidad debe desarrollarse en una rama secundaria creada a partir de la rama main o develop.
2. Probar localmente que el frontend consuma correctamente los endpoints antes de hacer el Push.
3. Asegurarse de no subir el archivo .env al repositorio público (incluido en .gitignore).

---

## 🤝 Contribución

1. Haz un Fork del repositorio.
2. Crea una rama para tu nueva característica:
   git checkout -b feature/nueva-funcionalidad
3. Realiza tus cambios y confírmalos (commits):
   git commit -m "Add: Implementación del módulo de reportes POS"
4. Envía tus cambios a tu repositorio remoto:
   git push origin feature/nueva-funcionalidad
5. Abre un Pull Request detallando las mejoras realizadas.

---

## 📄 Licencia

Este proyecto es de uso privado e interno para el negocio Dassel Sandals. Todos los derechos reservados.




# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
