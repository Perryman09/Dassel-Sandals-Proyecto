# 👠 Dassel Sandals - Backend (NestJS + Prisma ORM + PostgreSQL)

Backend robusto y profesional para el sistema de inventario y punto de venta (POS) de **Dassel Sandals**.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** NestJS 12 (TypeScript, Arquitectura Modular)
- **ORM:** Prisma ORM 7
- **Base de Datos:** PostgreSQL (Compatible con Supabase, Neon, Railway o Local)
- **Validación de Datos:** `class-validator` y `class-transformer`
- **Seguridad:** CORS configurado para comunicación directa con React (Vite)

---

## 📁 Estructura del Backend

```text
backend/
├── prisma/
│   ├── schema.prisma       # Modelado de base de datos (Product, Sale, SaleItem, Movement)
│   └── seed.ts             # Datos iniciales (Sandalias, Joyería artesanal y ventas demo)
├── prisma.config.ts        # Configuración de Prisma 7 para PostgreSQL
├── src/
│   ├── prisma/             # Servicio global de conexión Prisma
│   ├── products/           # Módulo de Inventario (CRUD, Códigos DS-ZAP/DS-JOY, Ajuste de Stock)
│   ├── sales/              # Módulo POS y Ventas (Transacciones atómicas, Reintegro de existencias)
│   ├── movements/          # Módulo Kardex (Auditoría de entradas, salidas y mermas)
│   ├── dashboard/          # Módulo de Métricas (Ganancias, Márgenes %, KPIs)
│   ├── app.module.ts       # Módulo raíz
│   └── main.ts             # Punto de entrada (CORS, validaciones, prefijo /api)
└── .env                    # Variables de entorno (DATABASE_URL, PORT)
```

---

## 🚀 Conexión con Supabase en 3 Pasos

### 1. Obtener la cadena de conexión de Supabase
1. Ingresa a tu proyecto en [Supabase](https://supabase.com).
2. Ve a **Project Settings** ➔ **Database** ➔ **Connection String**.
3. Selecciona la pestaña **URI** (o Node.js).
4. Copia la URL que luce similar a:
   ```env
   DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[REF-PROYECTO].supabase.co:5432/postgres?sslmode=require"
   ```

### 2. Guardarla en `backend/.env`
Abre el archivo `backend/.env` y reemplaza la línea `DATABASE_URL` con tu cadena real de Supabase.

### 3. Crear las tablas e inicializar datos
Desde la terminal en la carpeta `backend`, ejecuta:

```bash
# 1. Crear las tablas automáticamente en Supabase
npm run prisma:push

# 2. Cargar los zapatos y joyas de demostración en Supabase
npx ts-node prisma/seed.ts

# 3. Iniciar el servidor en modo desarrollo
npm run start:dev
```

El servidor quedará activo en: `http://localhost:3000/api`

---

## 🖥️ Prisma Studio (Panel Visual de Base de Datos)

Prisma incluye un visor visual tipo Excel para ver y editar tus tablas en vivo:

```bash
npm run prisma:studio
```
Abre automáticamente `http://localhost:5555` en tu navegador.

---

## 📡 Endpoints de la API REST

### Productos (`/api/products`)
- `GET /api/products`: Listado con filtros (`?search=&category=&status=&stock=`).
- `GET /api/products/:id`: Detalle de producto con sus últimos movimientos de stock.
- `GET /api/products/next-code/:category`: Obtiene el siguiente código disponible (`DS-ZAP-00X` o `DS-JOY-00X`).
- `POST /api/products`: Crear nuevo calzado o joya.
- `PATCH /api/products/:id`: Editar datos del producto.
- `PATCH /api/products/:id/adjust-stock`: Ajuste rápido (+ / -) con motivo para el Kardex.
- `DELETE /api/products/:id`: Eliminar producto.

### Ventas (`/api/sales`)
- `GET /api/sales`: Historial con filtros por fecha, cliente o método de pago.
- `GET /api/sales/:id`: Detalle de la venta con sus líneas de artículos.
- `GET /api/sales/next-number`: Siguiente folio correlativo (`VTA-000X`).
- `POST /api/sales`: Registrar venta atómica (descuenta stock y genera auditoría).
- `PATCH /api/sales/:id/cancel`: Cancelar venta y restaurar existencias automáticamente.

### Auditoría Kardex (`/api/movements`)
- `GET /api/movements`: Historial completo de entradas, salidas y ajustes de inventario.

### Métricas (`/api/dashboard`)
- `GET /api/dashboard/stats`: KPIs en tiempo real, valoración de existencias y márgenes de ganancia.
