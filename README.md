# 👡 Dassel Sandals - Sistema de Gestión y Punto de Venta

Sistema integral para el control de inventario, gestión de catálogo de productos, registro de clientes y procesamiento de ventas (POS) para la tienda de calzado **Dassel Sandals**.

---

## 📋 Tabla de Contenidos
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración e Instalación](#-configuración-e-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Endpoints Principales (API)](#-endpoints-principales-api)
- [Contribución](#-contribución)

---

## ✨ Características Principales

* 🏷️ **Gestión de Calzado y Catálogo:** Registro, edición y clasificación de productos por modelo, categoría, talla, color y precio.
* 📦 **Control de Inventario:** Monitoreo en tiempo real de stock disponible, alertas de bajo stock y registro de entradas/salidas.
* 💵 **Punto de Venta (POS):** Módulo ágil para procesamiento de ventas, facturación y emisión de comprobantes.
* 👥 **Gestión de Usuarios y Roles:** Control de acceso mediante roles (Administrador, Vendedor / Cajero).
* 📊 **Reportes y Métricas:** Visualización de ventas diarias, ingresos del período y productos más vendidos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React / Vite, HTML5, CSS3, JavaScript / TypeScript.
* **Backend:** Node.js, Express / NestJS.
* **Base de Datos / ORM:** SQL Server / PostgreSQL, Prisma ORM.
* **Autenticación:** JSON Web Tokens (JWT) / bcrypt.
* **Control de Versiones:** Git & GitHub.

---

## 📁 Estructura del Proyecto

```text
Dassel-Sandals-Proyecto/
├── client/ (o frontend/)
│   ├── src/
│   │   ├── assets/          # Imágenes, íconos y estilos globales
│   │   ├── components/      # Componentes UI reutilizables
│   │   ├── context/         # Estado global de la aplicación
│   │   ├── pages/           # Vistas y pantallas principales
│   │   └── services/        # Consumo de API REST
│   └── package.json
│
├── server/ (o backend/)
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── middlewares/     # Middlewares de autenticación y validación
│   │   ├── models/          # Modelos de datos / Schemas
│   │   ├── routes/          # Definición de rutas REST
│   │   └── utils/           # Utilidades y constantes
│   ├── prisma/              # Migraciones y esquema de base de datos
│   └── package.json
│
├── .gitignore
└── README.md




# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
