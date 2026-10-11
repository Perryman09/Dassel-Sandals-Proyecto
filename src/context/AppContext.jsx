import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { api } from '../services/api';
import { applyTheme, THEMES } from '../utils/theme';

const AppContext = createContext();

// Tallas estándar para calzado
// Tacones / Medida Europea (Continental): 35 al 42
export const SHOE_SIZES_EUR = ['35', '36', '37', '38', '39', '40', '41', '42'];
// Medida Americana (US): 4 al 11 con medios números
export const SHOE_SIZES_US = ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];
// Matriz combinada para compatibilidad
export const SHOE_SIZES = [...SHOE_SIZES_EUR, ...SHOE_SIZES_US];

export const SUBCATEGORIES = {
  zapatos: ['Sandalias', 'Huaraches', 'Plataformas', 'Flats', 'Tacones', 'Tacones Altos', 'Stilettos', 'Botines', 'Otro'],
  joyas: ['Collares', 'Pulseras', 'Aretes', 'Anillos', 'Tobilleras', 'Dijes', 'Cadenas', 'Juegos', 'Otro'],
};

export const initialCategories = [
  {
    id: 'zapatos',
    name: 'Zapatos & Tacones',
    icon: '👡',
    subcategories: ['Sandalias', 'Huaraches', 'Plataformas', 'Flats', 'Tacones', 'Tacones Altos', 'Stilettos', 'Botines', 'Otro'],
  },
  {
    id: 'joyas',
    name: 'Joyas & Accesorios',
    icon: '💎',
    subcategories: ['Collares', 'Pulseras', 'Aretes', 'Anillos', 'Tobilleras', 'Dijes', 'Cadenas', 'Juegos', 'Otro'],
  },
];

export const initialSuppliers = [
  {
    id: 1,
    code: 'PROV-001',
    name: 'Calzados & Tacones León S.A.',
    contactPerson: 'Carlos Morales',
    phone: '8822 1100',
    email: 'ventas@calzadosleon.ni',
    ruc: 'J031000045892',
    category: 'zapatos',
    address: 'Km 4.5 Carretera Norte, Managua',
    notes: 'Proveedor principal de sandalias de cuero y tacones de plataforma',
    status: 'active',
  },
  {
    id: 2,
    code: 'PROV-002',
    name: 'Platería & Joyas San Jerónimo',
    contactPerson: 'Elena Vega',
    phone: '8455 9988',
    email: 'contacto@joyassanjeronimo.com',
    ruc: 'J032000084711',
    category: 'joyas',
    address: 'Barrio Monimbó, Masaya',
    notes: 'Artesanos en plata 925, filigrana y pulseras con piedras semipreciosas',
    status: 'active',
  },
  {
    id: 3,
    code: 'PROV-003',
    name: 'Importadora Moda & Tacones Centroamérica',
    contactPerson: 'Kevin Rivas',
    phone: '8911 3344',
    email: 'pedidos@modacentroamerica.com',
    ruc: 'J031000077889',
    category: 'zapatos',
    address: 'Zona Franca Las Mercedes, Managua',
    notes: 'Tacones importados, stilettos y sandalias de fiesta (Tallas 35-42 EUR y US)',
    status: 'active',
  },
];

export const initialPurchases = [
  {
    id: 1,
    purchaseNumber: 'COM-0001',
    invoiceNumber: 'FAC-8420',
    supplierId: 1,
    supplierName: 'Calzados & Tacones León S.A.',
    date: '2026-10-05T10:00:00',
    paymentMethod: 'Transferencia',
    items: [
      {
        productId: 1,
        productCode: 'DS-ZAP-001',
        productName: 'Sandalia Maya Artesanal',
        quantity: 15,
        unitCost: 350,
        subtotal: 5250,
        sizesBreakdown: { '36': 3, '37': 5, '38': 5, '39': 2 },
      },
      {
        productId: 4,
        productCode: 'DS-ZAP-004',
        productName: 'Plataforma Yute Bohemia',
        quantity: 10,
        unitCost: 450,
        subtotal: 4500,
        sizesBreakdown: { '37': 4, '38': 4, '39': 2 },
      },
    ],
    total: 9750,
    status: 'received',
    notes: 'Lote de inicio de temporada recibido en óptimas condiciones',
  },
  {
    id: 2,
    purchaseNumber: 'COM-0002',
    invoiceNumber: 'FAC-1290',
    supplierId: 2,
    supplierName: 'Platería & Joyas San Jerónimo',
    date: '2026-10-06T14:30:00',
    paymentMethod: 'Efectivo',
    items: [
      {
        productId: 8,
        productCode: 'DS-JOY-001',
        productName: 'Collar Turquesa Bohemio',
        quantity: 20,
        unitCost: 150,
        subtotal: 3000,
      },
      {
        productId: 10,
        productCode: 'DS-JOY-003',
        productName: 'Aretes Luna y Sol Filigrana',
        quantity: 25,
        unitCost: 120,
        subtotal: 3000,
      },
    ],
    total: 6000,
    status: 'received',
    notes: 'Compra de surtido de joyería fina en plata y oro',
  },
];

// Lógica oficial de Descuento de Mayoreo (Calzado & Joyas):
// De 3 a 4 piezas -> 5%
// De 5 a 7 piezas -> 10%
// De 8 a más piezas -> 15%
export function getWholesaleTier(totalPieces) {
  if (totalPieces >= 8) {
    return { percent: 15, tierName: 'Mayoreo Oro (15%)', nextTierPieces: 0, nextPercent: 15 };
  }
  if (totalPieces >= 5) {
    return { percent: 10, tierName: 'Mayoreo Plata (10%)', nextTierPieces: 8 - totalPieces, nextPercent: 15 };
  }
  if (totalPieces >= 3) {
    return { percent: 5, tierName: 'Mayoreo Bronce (5%)', nextTierPieces: 5 - totalPieces, nextPercent: 10 };
  }
  return { percent: 0, tierName: 'Detalle (0%)', nextTierPieces: 3 - totalPieces, nextPercent: 5 };
}

const initialProducts = [
  {
    id: 1,
    code: 'DS-ZAP-001',
    name: 'Sandalia Maya Artesanal',
    category: 'zapatos',
    subcategory: 'Sandalias',
    description: 'Sandalia artesanal con bordado maya y suela anatómica',
    costPrice: 350,
    salePrice: 650,
    stock: 25,
    minStock: 5,
    size: 'US 5-9',
    sizesStock: { '5': 2, '6': 6, '7': 8, '7.5': 4, '8': 3, '9': 2 },
    material: 'Cuero sintético',
    color: 'Beige',
    status: 'active',
    createdAt: '2026-09-01',
  },
  {
    id: 2,
    code: 'DS-ZAP-002',
    name: 'Huarache Clásico Piel',
    category: 'zapatos',
    subcategory: 'Huaraches',
    description: 'Huarache tejido a mano en piel genuina con suela de hule',
    costPrice: 280,
    salePrice: 520,
    stock: 18,
    minStock: 5,
    size: 'US 6-10',
    sizesStock: { '6': 3, '7': 5, '8': 5, '9': 3, '10': 2 },
    material: 'Cuero genuino',
    color: 'Café Caramelo',
    status: 'active',
    createdAt: '2026-09-03',
  },
  {
    id: 3,
    code: 'DS-ZAP-003',
    name: 'Sandalia Playa Sunset',
    category: 'zapatos',
    subcategory: 'Sandalias',
    description: 'Sandalia impermeable ultraligera para alberca y playa',
    costPrice: 180,
    salePrice: 380,
    stock: 40,
    minStock: 10,
    size: 'US 5-9',
    sizesStock: { '5': 6, '6': 10, '7': 14, '8': 8, '9': 2 },
    material: 'EVA Premium',
    color: 'Negro Mate',
    status: 'active',
    createdAt: '2026-09-05',
  },
  {
    id: 4,
    code: 'DS-ZAP-004',
    name: 'Plataforma Yute Bohemia',
    category: 'zapatos',
    subcategory: 'Plataformas',
    description: 'Sandalia alta con tacón de cuña de yute trenzado',
    costPrice: 450,
    salePrice: 850,
    stock: 12,
    minStock: 5,
    size: 'US 6-8.5',
    sizesStock: { '6': 2, '7': 5, '8': 4, '8.5': 1 },
    material: 'Yute y Cuero',
    color: 'Dorado / Natural',
    status: 'active',
    createdAt: '2026-09-10',
  },
  {
    id: 5,
    code: 'DS-ZAP-005',
    name: 'Flat Confort Acolchada',
    category: 'zapatos',
    subcategory: 'Flats',
    description: 'Sandalia de piso ultra cómoda con plantilla de memory foam',
    costPrice: 200,
    salePrice: 420,
    stock: 3,
    minStock: 5,
    size: 'US 6-8',
    sizesStock: { '6': 1, '7': 1, '8': 1 },
    material: 'Gamuza sintética',
    color: 'Rosa Palo',
    status: 'active',
    createdAt: '2026-09-12',
  },
  {
    id: 6,
    code: 'DS-ZAP-006',
    name: 'Huarache Frida Mexicano',
    category: 'zapatos',
    subcategory: 'Huaraches',
    description: 'Diseño tradicional artesanal con costura reforzada',
    costPrice: 320,
    salePrice: 580,
    stock: 0,
    minStock: 5,
    size: 'US 7-11',
    sizesStock: { '7': 0, '8': 0, '9': 0, '10': 0, '11': 0 },
    material: 'Piel Vacuna',
    color: 'Miel',
    status: 'active',
    createdAt: '2026-09-15',
  },
  {
    id: 7,
    code: 'DS-ZAP-007',
    name: 'Sandalia Tiras Brillantes',
    category: 'zapatos',
    subcategory: 'Sandalias',
    description: 'Sandalia de fiesta con tiras delgadas brillantes',
    costPrice: 400,
    salePrice: 750,
    stock: 8,
    minStock: 5,
    size: 'US 5-8.5',
    sizesStock: { '5': 1, '6': 2, '7': 3, '8.5': 2 },
    material: 'Microfibra y Strass',
    color: 'Dorado',
    status: 'active',
    createdAt: '2026-09-18',
  },
  {
    id: 8,
    code: 'DS-JOY-001',
    name: 'Collar Turquesa Bohemio',
    category: 'joyas',
    subcategory: 'Collares',
    description: 'Collar con piedra natural turquesa y cadena de chapa de oro',
    costPrice: 150,
    salePrice: 350,
    stock: 15,
    minStock: 3,
    size: '45 cm',
    material: 'Chapa de oro y Turquesa',
    color: 'Turquesa / Oro',
    status: 'active',
    createdAt: '2026-09-02',
  },
  {
    id: 9,
    code: 'DS-JOY-002',
    name: 'Pulsera Conchas Marinas',
    category: 'joyas',
    subcategory: 'Pulseras',
    description: 'Pulsera ajustable tejida a mano con dijes de cauri natural',
    costPrice: 80,
    salePrice: 180,
    stock: 30,
    minStock: 5,
    size: 'Ajustable',
    material: 'Hilo encerado y Cauri',
    color: 'Blanco / Dorado',
    status: 'active',
    createdAt: '2026-09-04',
  },
  {
    id: 10,
    code: 'DS-JOY-003',
    name: 'Aretes Luna y Sol Filigrana',
    category: 'joyas',
    subcategory: 'Aretes',
    description: 'Par de aretes asimétricos con diseño grabado fino',
    costPrice: 120,
    salePrice: 280,
    stock: 20,
    minStock: 5,
    size: '3.5 cm',
    material: 'Acero quirúrgico dorado',
    color: 'Dorado',
    status: 'active',
    createdAt: '2026-09-06',
  },
  {
    id: 11,
    code: 'DS-JOY-004',
    name: 'Anillo Flor de Loto Plata',
    category: 'joyas',
    subcategory: 'Anillos',
    description: 'Anillo abierto ajustable con detalle en plata esterlina',
    costPrice: 90,
    salePrice: 220,
    stock: 2,
    minStock: 5,
    size: 'Ajustable',
    material: 'Plata 925',
    color: 'Plateado',
    status: 'active',
    createdAt: '2026-09-08',
  },
  {
    id: 12,
    code: 'DS-JOY-005',
    name: 'Tobillera Playera Perlas',
    category: 'joyas',
    subcategory: 'Tobilleras',
    description: 'Tobillera fina con perlas de río y concha marina',
    costPrice: 60,
    salePrice: 150,
    stock: 25,
    minStock: 5,
    size: '24 cm',
    material: 'Perlas de río cultivadas',
    color: 'Blanco Perlado',
    status: 'active',
    createdAt: '2026-09-11',
  },
  {
    id: 13,
    code: 'DS-JOY-006',
    name: 'Collar Mandala Sagrado',
    category: 'joyas',
    subcategory: 'Collares',
    description: 'Medallón con dije de geometría sagrada y cadena larga',
    costPrice: 130,
    salePrice: 300,
    stock: 0,
    minStock: 3,
    size: '60 cm',
    material: 'Bronce antiguo',
    color: 'Bronce Vintage',
    status: 'inactive',
    createdAt: '2026-09-14',
  },
  {
    id: 14,
    code: 'DS-JOY-007',
    name: 'Pulsera Piedra Volcánica',
    category: 'joyas',
    subcategory: 'Pulseras',
    description: 'Pulsera elástica de cuentas de lava volcánica natural',
    costPrice: 100,
    salePrice: 240,
    stock: 14,
    minStock: 5,
    size: '19 cm',
    material: 'Piedra volcánica',
    color: 'Negro Mate',
    status: 'active',
    createdAt: '2026-09-20',
  },
];

const initialSales = [
  {
    id: 1,
    saleNumber: 'VTA-0001',
    date: '2026-10-07T10:30:00',
    items: [
      { productId: 1, productCode: 'DS-ZAP-001', productName: 'Sandalia Maya Artesanal', selectedSize: '24', quantity: 2, price: 650, costPrice: 350, subtotal: 1300 },
      { productId: 8, productCode: 'DS-JOY-001', productName: 'Collar Turquesa Bohemio', selectedSize: '', quantity: 1, price: 350, costPrice: 150, subtotal: 350 },
    ],
    subtotal: 1650,
    discount: 0,
    total: 1650,
    paymentMethod: 'Efectivo',
    receivedAmount: 2000,
    customerName: 'María García',
    customerPhone: '88776655',
    status: 'completed',
  },
  {
    id: 2,
    saleNumber: 'VTA-0002',
    date: '2026-10-07T12:15:00',
    items: [
      { productId: 3, productCode: 'DS-ZAP-003', productName: 'Sandalia Playa Sunset', selectedSize: '23', quantity: 3, price: 380, costPrice: 180, subtotal: 1140 },
    ],
    subtotal: 1140,
    discount: 100,
    total: 1040,
    paymentMethod: 'Tarjeta',
    receivedAmount: null,
    customerName: 'Ana López',
    customerPhone: '87654321',
    status: 'completed',
  },
  {
    id: 3,
    saleNumber: 'VTA-0003',
    date: '2026-10-06T14:00:00',
    items: [
      { productId: 4, productCode: 'DS-ZAP-004', productName: 'Plataforma Yute Bohemia', selectedSize: '24', quantity: 1, price: 850, costPrice: 450, subtotal: 850 },
      { productId: 10, productCode: 'DS-JOY-003', productName: 'Aretes Luna y Sol Filigrana', selectedSize: '', quantity: 2, price: 280, costPrice: 120, subtotal: 560 },
    ],
    subtotal: 1410,
    discount: 0,
    total: 1410,
    paymentMethod: 'Transferencia',
    receivedAmount: null,
    customerName: 'Laura Martínez',
    customerPhone: '85544332',
    status: 'completed',
  },
  {
    id: 4,
    saleNumber: 'VTA-0004',
    date: '2026-10-06T16:45:00',
    items: [
      { productId: 9, productCode: 'DS-JOY-002', productName: 'Pulsera Conchas Marinas', selectedSize: '', quantity: 5, price: 180, costPrice: 80, subtotal: 900 },
    ],
    subtotal: 900,
    discount: 50,
    total: 850,
    paymentMethod: 'Efectivo',
    receivedAmount: 1000,
    customerName: 'Roberto Sánchez',
    customerPhone: '',
    status: 'completed',
  },
];

const initialMovements = [
  { id: 1, date: '2026-10-07T12:15:00', type: 'salida', reason: 'Venta VTA-0002', productCode: 'DS-ZAP-003', productName: 'Sandalia Playa Sunset (Talla 23)', quantity: 3, remainingStock: 40 },
  { id: 2, date: '2026-10-07T10:30:00', type: 'salida', reason: 'Venta VTA-0001', productCode: 'DS-ZAP-001', productName: 'Sandalia Maya Artesanal (Talla 24)', quantity: 2, remainingStock: 25 },
  { id: 3, date: '2026-10-07T09:00:00', type: 'entrada', reason: 'Recepción Taller Artesanal', productCode: 'DS-ZAP-001', productName: 'Sandalia Maya Artesanal', quantity: 15, remainingStock: 27 },
];

const initialCashMovements = [
  { id: 1, date: '2026-10-07T08:30:00', type: 'apertura', category: 'Fondo Inicial', description: 'Apertura de turno en caja', amount: 1500 },
  { id: 2, date: '2026-10-07T11:00:00', type: 'salida', category: 'Empaque Boutique', description: 'Compra de bolsas con logo y papel seda', amount: 280 },
  { id: 3, date: '2026-10-07T15:30:00', type: 'salida', category: 'Paquetería y Envíos', description: 'Pago de mensajería para entrega de sandalias', amount: 150 },
  { id: 4, date: '2026-10-07T16:00:00', type: 'entrada', category: 'Aporte de Cambio', description: 'Ingreso de monedas y billetes menores para cambio', amount: 500 },
];

function loadSavedData(key, fallback) {
  try {
    const data = localStorage.getItem(`dassel_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_PURCHASES':
      return { ...state, purchases: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_CASH_MOVEMENTS':
      return { ...state, cashMovements: action.payload };

    case 'ADD_PRODUCT': {
      const newProduct = { ...action.payload, id: action.payload.id || Date.now() };
      const newMovement = {
        id: Date.now() + 1,
        date: new Date().toISOString(),
        type: 'entrada',
        reason: 'Registro inicial de producto',
        productCode: newProduct.code,
        productName: newProduct.name,
        quantity: Number(newProduct.stock) || 0,
        remainingStock: Number(newProduct.stock) || 0,
      };
      return {
        ...state,
        products: [...state.products, newProduct],
        movements: [newMovement, ...state.movements],
      };
    }

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'ADJUST_STOCK': {
      const target = state.products.find(p => p.id === action.payload.id);
      if (!target) return state;
      const adjustQty = Number(action.payload.quantity) || 0;
      const targetSize = action.payload.size;
      const payloadSizesStock = action.payload.sizesStock;

      let newSizesStock = target.sizesStock ? { ...target.sizesStock } : (target.category === 'zapatos' ? {} : null);
      let newStock = Number(target.stock);

      if (payloadSizesStock && typeof payloadSizesStock === 'object') {
        newSizesStock = { ...payloadSizesStock };
        newStock = Object.values(newSizesStock).reduce((acc, n) => acc + (Number(n) || 0), 0);
      } else if (newSizesStock && targetSize) {
        const curForSize = Number(newSizesStock[targetSize]) || 0;
        newSizesStock[targetSize] = Math.max(0, curForSize + adjustQty);
        newStock = Object.values(newSizesStock).reduce((acc, n) => acc + (Number(n) || 0), 0);
      } else {
        newStock = Math.max(0, Number(target.stock) + adjustQty);
      }

      const movement = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: adjustQty >= 0 ? 'entrada' : 'salida',
        reason: action.payload.reason || (adjustQty >= 0 ? 'Entrada manual de inventario' : 'Salida manual / Merma'),
        productCode: target.code,
        productName: targetSize ? `${target.name} (Talla ${targetSize})` : target.name,
        quantity: Math.abs(adjustQty) || Math.abs(newStock - Number(target.stock)),
        remainingStock: newStock,
      };

      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id
            ? { ...p, stock: newStock, sizesStock: newSizesStock || p.sizesStock }
            : p
        ),
        movements: [movement, ...state.movements],
      };
    }

    case 'ADD_SALE': {
      const newSale = {
        ...action.payload,
        id: action.payload.id || Date.now(),
        subtotal: Number(action.payload.subtotal) || 0,
        total: Number(action.payload.total) || 0,
      };

      const newSaleMovements = [];
      const updatedProducts = state.products.map(p => {
        const saleItemsForProduct = newSale.items.filter(i => i.productId === p.id);
        if (saleItemsForProduct.length > 0) {
          const totalQtyDeducted = saleItemsForProduct.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
          const afterStock = Math.max(0, Number(p.stock) - totalQtyDeducted);

          let updatedSizes = p.sizesStock ? { ...p.sizesStock } : null;
          saleItemsForProduct.forEach(it => {
            if (updatedSizes && it.selectedSize && updatedSizes[it.selectedSize] !== undefined) {
              updatedSizes[it.selectedSize] = Math.max(0, Number(updatedSizes[it.selectedSize]) - Number(it.quantity || 1));
            }
            newSaleMovements.push({
              id: Date.now() + Math.random(),
              date: new Date().toISOString(),
              type: 'salida',
              reason: `Venta ${newSale.saleNumber}`,
              productCode: p.code,
              productName: it.selectedSize ? `${p.name} (Talla ${it.selectedSize})` : p.name,
              quantity: Number(it.quantity || 1),
              remainingStock: afterStock,
            });
          });

          return { ...p, stock: afterStock, sizesStock: updatedSizes || p.sizesStock };
        }
        return p;
      });

      return {
        ...state,
        sales: [newSale, ...state.sales],
        products: updatedProducts,
        movements: [...newSaleMovements, ...state.movements],
      };
    }

    case 'CANCEL_SALE': {
      const sale = state.sales.find(s => s.id === action.payload);
      if (!sale || sale.status === 'cancelled') return state;
      const returnMovements = [];

      const restoredProducts = state.products.map(p => {
        const items = sale.items.filter(i => i.productId === p.id);
        if (items.length > 0) {
          const totalRestored = items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
          const afterStock = Number(p.stock) + totalRestored;

          let updatedSizes = p.sizesStock ? { ...p.sizesStock } : null;
          items.forEach(it => {
            if (updatedSizes && it.selectedSize && updatedSizes[it.selectedSize] !== undefined) {
              updatedSizes[it.selectedSize] = Number(updatedSizes[it.selectedSize]) + Number(it.quantity || 1);
            }
            returnMovements.push({
              id: Date.now() + Math.random(),
              date: new Date().toISOString(),
              type: 'entrada',
              reason: `Devolución por cancelación ${sale.saleNumber}`,
              productCode: it.productCode,
              productName: it.selectedSize ? `${it.productName} (Talla ${it.selectedSize})` : it.productName,
              quantity: Number(it.quantity || 1),
              remainingStock: afterStock,
            });
          });

          return { ...p, stock: afterStock, sizesStock: updatedSizes || p.sizesStock };
        }
        return p;
      });

      return {
        ...state,
        sales: state.sales.map(s => (s.id === action.payload ? { ...s, status: 'cancelled' } : s)),
        products: restoredProducts,
        movements: [...returnMovements, ...state.movements],
      };
    }

    case 'ADD_CASH_MOVEMENT': {
      const movement = {
        ...action.payload,
        id: Date.now(),
        date: new Date().toISOString(),
        amount: Number(action.payload.amount) || 0,
      };
      return {
        ...state,
        cashMovements: [movement, ...state.cashMovements],
      };
    }

    // --- ACCIONES DE COMPRAS & PROVEEDORES ---
    case 'SET_PURCHASES':
      return { ...state, purchases: action.payload };

    case 'ADD_PURCHASE': {
      const newPurchase = {
        ...action.payload,
        id: action.payload.id || Date.now(),
        date: action.payload.date || new Date().toISOString(),
        total: Number(action.payload.total) || 0,
      };

      const newMovements = [];
      const updatedProducts = state.products.map(p => {
        const pItems = (newPurchase.items || []).filter(it => it.productId === p.id);
        if (pItems.length === 0) return p;

        let addedStock = 0;
        let updatedSizesStock = p.sizesStock ? { ...p.sizesStock } : (p.category === 'zapatos' ? {} : null);
        let latestCost = Number(p.costPrice) || 0;

        pItems.forEach(it => {
          const qty = Number(it.quantity) || 0;
          addedStock += qty;
          if (it.unitCost && Number(it.unitCost) > 0) {
            latestCost = Number(it.unitCost);
          }

          if (it.sizesBreakdown && typeof it.sizesBreakdown === 'object') {
            if (!updatedSizesStock) updatedSizesStock = {};
            Object.entries(it.sizesBreakdown).forEach(([sz, q]) => {
              const numQ = Number(q) || 0;
              updatedSizesStock[sz] = (Number(updatedSizesStock[sz]) || 0) + numQ;
            });
          }

          newMovements.push({
            id: Date.now() + Math.random(),
            date: newPurchase.date,
            type: 'entrada',
            reason: `Compra #${newPurchase.purchaseNumber} (Fact: ${newPurchase.invoiceNumber || 'S/N'} - ${newPurchase.supplierName || 'Proveedor'})`,
            productCode: p.code,
            productName: p.name,
            quantity: qty,
            remainingStock: Number(p.stock) + addedStock,
          });
        });

        const newStock = Number(p.stock) + addedStock;

        return {
          ...p,
          stock: newStock,
          costPrice: latestCost,
          sizesStock: updatedSizesStock || p.sizesStock,
        };
      });

      let newCashMovements = [...state.cashMovements];
      if (newPurchase.paymentMethod === 'Efectivo' && newPurchase.total > 0) {
        newCashMovements = [
          {
            id: Date.now() + 2,
            date: newPurchase.date,
            type: 'salida',
            category: 'Compra de Mercancía',
            description: `Pago Fact. ${newPurchase.invoiceNumber || 'S/N'} (${newPurchase.supplierName || 'Proveedor'})`,
            amount: Number(newPurchase.total) || 0,
          },
          ...newCashMovements,
        ];
      }

      return {
        ...state,
        purchases: [newPurchase, ...(state.purchases || [])],
        products: updatedProducts,
        movements: [...newMovements, ...state.movements],
        cashMovements: newCashMovements,
      };
    }

    case 'CANCEL_PURCHASE': {
      const purchase = (state.purchases || []).find(p => p.id === action.payload);
      if (!purchase || purchase.status === 'cancelled') return state;

      const cancelMovements = [];
      const restoredProducts = state.products.map(p => {
        const pItems = (purchase.items || []).filter(it => it.productId === p.id);
        if (pItems.length === 0) return p;

        let deductedStock = 0;
        let updatedSizesStock = p.sizesStock ? { ...p.sizesStock } : null;

        pItems.forEach(it => {
          const qty = Number(it.quantity) || 0;
          deductedStock += qty;

          if (updatedSizesStock && it.sizesBreakdown) {
            Object.entries(it.sizesBreakdown).forEach(([sz, q]) => {
              const numQ = Number(q) || 0;
              updatedSizesStock[sz] = Math.max(0, (Number(updatedSizesStock[sz]) || 0) - numQ);
            });
          }

          cancelMovements.push({
            id: Date.now() + Math.random(),
            date: new Date().toISOString(),
            type: 'salida',
            reason: `Anulación Compra #${purchase.purchaseNumber}`,
            productCode: p.code,
            productName: p.name,
            quantity: qty,
            remainingStock: Math.max(0, Number(p.stock) - deductedStock),
          });
        });

        return {
          ...p,
          stock: Math.max(0, Number(p.stock) - deductedStock),
          sizesStock: updatedSizesStock || p.sizesStock,
        };
      });

      return {
        ...state,
        purchases: (state.purchases || []).map(p => p.id === action.payload ? { ...p, status: 'cancelled' } : p),
        products: restoredProducts,
        movements: [...cancelMovements, ...state.movements],
      };
    }

    // --- ACCIONES DE PROVEEDORES ---
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };

    case 'ADD_SUPPLIER': {
      const newSup = { ...action.payload, id: action.payload.id || Date.now() };
      return { ...state, suppliers: [...(state.suppliers || []), newSup] };
    }

    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: (state.suppliers || []).map(s => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s),
      };

    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: (state.suppliers || []).filter(s => s.id !== action.payload),
      };

    // --- ACCIONES DE CATEGORÍAS & SUBCATEGORÍAS ---
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...(state.categories || []), action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: (state.categories || []).map(c => c.id === action.payload.id ? { ...c, ...action.payload.data } : c),
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: (state.categories || []).filter(c => c.id !== action.payload),
      };

    case 'ADD_SUBCATEGORY': {
      const { categoryId, subcategory } = action.payload;
      return {
        ...state,
        categories: (state.categories || []).map(c => {
          if (c.id === categoryId) {
            const current = c.subcategories || [];
            if (!current.includes(subcategory)) {
              return { ...c, subcategories: [...current, subcategory] };
            }
          }
          return c;
        }),
      };
    }

    case 'UPDATE_SUBCATEGORY': {
      const { categoryId, oldName, newName } = action.payload;
      return {
        ...state,
        categories: (state.categories || []).map(c => {
          if (c.id === categoryId) {
            return {
              ...c,
              subcategories: (c.subcategories || []).map(s => s === oldName ? newName : s),
            };
          }
          return c;
        }),
        products: state.products.map(p => {
          if (p.category === categoryId && p.subcategory === oldName) {
            return { ...p, subcategory: newName };
          }
          return p;
        }),
      };
    }

    case 'DELETE_SUBCATEGORY': {
      const { categoryId, subcategory } = action.payload;
      return {
        ...state,
        categories: (state.categories || []).map(c => {
          if (c.id === categoryId) {
            return {
              ...c,
              subcategories: (c.subcategories || []).filter(s => s !== subcategory),
            };
          }
          return c;
        }),
      };
    }

    case 'RESET_ALL':
      return {
        products: initialProducts,
        sales: initialSales,
        movements: initialMovements,
        cashMovements: initialCashMovements,
        categories: initialCategories,
        suppliers: initialSuppliers,
        purchases: initialPurchases,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [backendOnline, setBackendOnline] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('amber');
  const [themeMode, setThemeMode] = useState('dark');

  // Usuario Autenticado
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dassel_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    if (backendOnline) {
      try {
        const res = await api.login({ username, password });
        if (res && res.user) {
          localStorage.setItem('dassel_auth_user', JSON.stringify(res.user));
          if (res.token) localStorage.setItem('dassel_auth_token', res.token);
          setCurrentUser(res.user);
          return { success: true, user: res.user };
        }
      } catch (err) {
        throw new Error(err.message || 'Usuario o contraseña incorrectos');
      }
    }

    // Fallback de validación si el backend estuviera desconectado
    if (username === 'Dassel2026' && password === 'DasselSandals2026') {
      const adminUser = {
        id: 1,
        username: 'Dassel2026',
        name: 'Dueño & Administrador Principal',
        role: 'admin',
        avatar: '/dassel-logo.png',
      };
      localStorage.setItem('dassel_auth_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }

    throw new Error('Usuario o contraseña incorrectos');
  };

  const logout = () => {
    localStorage.removeItem('dassel_auth_user');
    localStorage.removeItem('dassel_auth_token');
    setCurrentUser(null);
  };

  const [state, dispatch] = useReducer(appReducer, null, () => ({
    products: loadSavedData('products', initialProducts),
    sales: loadSavedData('sales', initialSales),
    movements: loadSavedData('movements', initialMovements),
    cashMovements: loadSavedData('cash_movements', initialCashMovements),
    categories: loadSavedData('categories', initialCategories),
    suppliers: loadSavedData('suppliers', initialSuppliers),
    purchases: loadSavedData('purchases', initialPurchases),
  }));

  // Cargar tema y modo guardados al iniciar
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('dassel_theme') || 'amber';
      const savedMode = localStorage.getItem('dassel_mode') || 'dark';
      setCurrentTheme(savedTheme);
      setThemeMode(savedMode);
      applyTheme(savedTheme, savedMode);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId, themeMode);
  };

  const toggleThemeMode = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    applyTheme(currentTheme, nextMode);
  };

  // Comprobar estado del backend NestJS
  useEffect(() => {
    async function checkBackend() {
      try {
        const online = await api.checkHealth();
        setBackendOnline(online);
        if (online) {
          const [
            dbProducts,
            dbSales,
            dbMovements,
            dbSuppliers,
            dbPurchases,
            dbCategories,
            dbCashMovements,
          ] = await Promise.all([
            api.getProducts().catch(() => null),
            api.getSales().catch(() => null),
            api.getMovements().catch(() => null),
            api.getSuppliers().catch(() => null),
            api.getPurchases().catch(() => null),
            api.getCategories().catch(() => null),
            api.getCashMovements().catch(() => null),
          ]);
          if (dbProducts && Array.isArray(dbProducts)) dispatch({ type: 'SET_PRODUCTS', payload: dbProducts });
          if (dbSales && Array.isArray(dbSales)) dispatch({ type: 'SET_SALES', payload: dbSales });
          if (dbMovements && Array.isArray(dbMovements)) dispatch({ type: 'SET_MOVEMENTS', payload: dbMovements });
          if (dbSuppliers && Array.isArray(dbSuppliers) && dbSuppliers.length > 0) {
            dispatch({ type: 'SET_SUPPLIERS', payload: dbSuppliers });
          }
          if (dbPurchases && Array.isArray(dbPurchases) && dbPurchases.length > 0) {
            dispatch({ type: 'SET_PURCHASES', payload: dbPurchases });
          }
          if (dbCategories && Array.isArray(dbCategories) && dbCategories.length > 0) {
            dispatch({ type: 'SET_CATEGORIES', payload: dbCategories });
          }
          if (dbCashMovements && Array.isArray(dbCashMovements) && dbCashMovements.length > 0) {
            dispatch({ type: 'SET_CASH_MOVEMENTS', payload: dbCashMovements });
          }
        }
      } catch {
        setBackendOnline(false);
      }
    }
    checkBackend();
  }, []);

  // Sincronizar en localStorage como respaldo local
  useEffect(() => {
    try {
      localStorage.setItem('dassel_products', JSON.stringify(state.products));
      localStorage.setItem('dassel_sales', JSON.stringify(state.sales));
      localStorage.setItem('dassel_movements', JSON.stringify(state.movements));
      localStorage.setItem('dassel_cash_movements', JSON.stringify(state.cashMovements));
      localStorage.setItem('dassel_categories', JSON.stringify(state.categories));
      localStorage.setItem('dassel_suppliers', JSON.stringify(state.suppliers));
      localStorage.setItem('dassel_purchases', JSON.stringify(state.purchases));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [state]);

  const addProduct = async (product) => {
    let finalStock = Number(product.stock) || 0;
    if (product.category === 'zapatos' && product.sizesStock && typeof product.sizesStock === 'object') {
      const sum = Object.values(product.sizesStock).reduce((acc, n) => acc + (Number(n) || 0), 0);
      finalStock = sum;
    }

    let formatted = {
      ...product,
      costPrice: Number(product.costPrice) || 0,
      salePrice: Number(product.salePrice) || 0,
      stock: finalStock,
      minStock: Number(product.minStock) || 5,
      sizesStock: product.sizesStock || null,
    };

    if (backendOnline) {
      try {
        const created = await api.createProduct(formatted);
        if (created) {
          const payload = {
            ...formatted,
            ...created,
            sizesStock: created.sizesStock || formatted.sizesStock,
          };
          dispatch({ type: 'ADD_PRODUCT', payload });
          return payload;
        }
      } catch (err) {
        console.warn('Fallo al guardar en backend, guardando local:', err);
      }
    }
    dispatch({ type: 'ADD_PRODUCT', payload: formatted });
    return formatted;
  };

  const updateProduct = async (id, updates) => {
    let finalStock = updates.stock !== undefined ? Number(updates.stock) : undefined;
    if (updates.category === 'zapatos' && updates.sizesStock && typeof updates.sizesStock === 'object') {
      finalStock = Object.values(updates.sizesStock).reduce((acc, n) => acc + (Number(n) || 0), 0);
    }

    let formatted = {
      ...updates,
      ...(updates.costPrice !== undefined && { costPrice: Number(updates.costPrice) }),
      ...(updates.salePrice !== undefined && { salePrice: Number(updates.salePrice) }),
      ...(finalStock !== undefined && { stock: finalStock }),
      ...(updates.sizesStock !== undefined && { sizesStock: updates.sizesStock }),
    };

    if (backendOnline) {
      try {
        const updated = await api.updateProduct(id, formatted);
        if (updated) {
          formatted = { ...formatted, ...updated, sizesStock: updated.sizesStock || formatted.sizesStock };
        }
      } catch (err) {
        console.warn('Fallo al actualizar en backend:', err);
      }
    }
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id, updates: formatted } });
    return formatted;
  };

  const deleteProduct = async (id) => {
    if (backendOnline) {
      try {
        await api.deleteProduct(id);
      } catch (err) {
        console.warn('Fallo al eliminar en backend:', err);
      }
    }
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const adjustStock = async (id, quantity, reason, size, sizesStock) => {
    const qtyNum = Number(quantity) || 0;
    if (backendOnline) {
      try {
        await api.adjustStock(id, qtyNum, reason, size, sizesStock);
      } catch (err) {
        console.warn('Fallo al ajustar en backend:', err);
      }
    }
    dispatch({ type: 'ADJUST_STOCK', payload: { id, quantity: qtyNum, reason, size, sizesStock } });
  };

  const addSale = async (sale) => {
    const formattedSale = {
      ...sale,
      subtotal: Number(sale.subtotal) || 0,
      discount: Number(sale.discount) || 0,
      total: Number(sale.total) || 0,
      receivedAmount: sale.receivedAmount ? Number(sale.receivedAmount) : null,
      items: (sale.items || []).map(it => ({
        ...it,
        price: Number(it.price) || 0,
        costPrice: Number(it.costPrice) || 0,
        quantity: Number(it.quantity) || 1,
        subtotal: Number(it.subtotal) || (Number(it.price) * Number(it.quantity)),
      })),
    };

    if (backendOnline) {
      try {
        const created = await api.createSale(formattedSale);
        dispatch({ type: 'ADD_SALE', payload: created });
        return created;
      } catch (err) {
        console.warn('Fallo al registrar venta en backend:', err);
      }
    }
    dispatch({ type: 'ADD_SALE', payload: formattedSale });
  };

  const cancelSale = async (id) => {
    if (backendOnline) {
      try {
        await api.cancelSale(id);
      } catch (err) {
        console.warn('Fallo al cancelar en backend:', err);
      }
    }
    dispatch({ type: 'CANCEL_SALE', payload: id });
  };

  const addCashMovement = async (data) => {
    if (backendOnline) {
      try {
        const created = await api.createCashMovement(data);
        if (created) {
          dispatch({ type: 'ADD_CASH_MOVEMENT', payload: created });
          return created;
        }
      } catch (err) {
        console.warn('Fallo al registrar movimiento de caja en backend:', err);
      }
    }
    dispatch({ type: 'ADD_CASH_MOVEMENT', payload: data });
  };

  const resetAllData = () => dispatch({ type: 'RESET_ALL' });

  const getNextCode = (category) => {
    const prefix = category === 'zapatos' ? 'DS-ZAP' : 'DS-JOY';
    const existing = state.products.filter(p => p.code.startsWith(prefix));
    const maxNum = existing.reduce((max, p) => {
      const parts = p.code.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const getNextSaleNumber = () => {
    const maxNum = state.sales.reduce((max, s) => {
      const parts = s.saleNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `VTA-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Cálculo de Caja del Día (Arqueo)
  const getCashBalance = () => {
    const today = new Date().toISOString().split('T')[0];

    // Ventas en efectivo de hoy
    const cashSalesToday = state.sales
      .filter(s => s.status === 'completed' && s.paymentMethod === 'Efectivo' && String(s.date).startsWith(today))
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // Movimientos de caja de hoy
    const todayCashMoves = state.cashMovements.filter(m => String(m.date).startsWith(today));

    const totalApertura = todayCashMoves
      .filter(m => m.type === 'apertura')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const totalEntradas = todayCashMoves
      .filter(m => m.type === 'entrada')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const totalSalidas = todayCashMoves
      .filter(m => m.type === 'salida')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const saldoEsperado = totalApertura + cashSalesToday + totalEntradas - totalSalidas;

    return {
      totalApertura,
      cashSalesToday,
      totalEntradas,
      totalSalidas,
      saldoEsperado,
      movements: todayCashMoves,
    };
  };

  // Métricas generales
  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const completedSales = state.sales.filter(s => s.status === 'completed');
    const todaySales = completedSales.filter(s => s.date && String(s.date).startsWith(today));
    const now = new Date();
    const monthSales = completedSales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    let monthCost = 0;
    monthSales.forEach(s => {
      (s.items || []).forEach(it => {
        const prod = state.products.find(p => p.id === it.productId);
        const unitCost = Number(it.costPrice) || (prod ? Number(prod.costPrice) : Number(it.price) * 0.5);
        monthCost += unitCost * Number(it.quantity || 1);
      });
    });

    const monthRevenue = monthSales.reduce((s, v) => s + (Number(v.total) || 0), 0);
    const monthProfit = Math.max(0, monthRevenue - monthCost);
    const profitMargin = monthRevenue > 0 ? Number(((monthProfit / monthRevenue) * 100).toFixed(1)) : 0;

    return {
      totalProducts: state.products.length,
      activeProducts: state.products.filter(p => p.status === 'active').length,
      totalStockUnits: state.products.reduce((s, p) => s + (Number(p.stock) || 0), 0),
      totalStockCostValue: state.products.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0),
      totalStockSaleValue: state.products.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0),
      todaySalesCount: todaySales.length,
      todaysRevenue: todaySales.reduce((s, v) => s + (Number(v.total) || 0), 0),
      monthSalesCount: monthSales.length,
      monthRevenue,
      monthProfit,
      profitMargin,
      lowStockProducts: state.products.filter(p => p.status === 'active' && p.stock > 0 && p.stock <= p.minStock),
      outOfStockProducts: state.products.filter(p => p.status === 'active' && p.stock === 0),
    };
  };

  const exportProductsCSV = () => {
    const headers = ['Código', 'Nombre', 'Categoría', 'Subcategoría', 'Tallas Stock', 'Material', 'Color', 'Precio Costo (C$)', 'Precio Venta (C$)', 'Stock Total', 'Stock Mínimo', 'Estado'];
    const rows = state.products.map(p => [
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.subcategory,
      p.sizesStock ? `"${Object.entries(p.sizesStock).map(([s, q]) => `T${s}:${q}`).join(' ')}"` : (p.size || ''),
      `"${(p.material || '').replace(/"/g, '""')}"`,
      p.color || '',
      p.costPrice,
      p.salePrice,
      p.stock,
      p.minStock,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Dassel_Sandals_Inventario_NIO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesCSV = () => {
    const headers = ['Número Venta', 'Fecha', 'Cliente', 'Método Pago', 'Subtotal (C$)', 'Descuento (C$)', 'Total (C$)', 'Estado', 'Artículos'];
    const rows = state.sales.map(s => [
      s.saleNumber,
      s.date,
      `"${(s.customerName || 'Cliente').replace(/"/g, '""')}"`,
      s.paymentMethod,
      s.subtotal,
      s.discount,
      s.total,
      s.status,
      `"${(s.items || []).map(i => `${i.quantity}x ${i.productName}${i.selectedSize ? ` (Talla ${i.selectedSize})` : ''}`).join('; ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Dassel_Sandals_Ventas_NIO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Operaciones de Compras
  const addPurchase = async (purchaseData) => {
    if (backendOnline) {
      try {
        const created = await api.createPurchase(purchaseData);
        if (created) {
          dispatch({ type: 'ADD_PURCHASE', payload: created });
          // Sincronizar existencias y Kardex actualizados en backend
          const [updatedProds, updatedMoves, updatedCash] = await Promise.all([
            api.getProducts().catch(() => null),
            api.getMovements().catch(() => null),
            api.getCashMovements().catch(() => null),
          ]);
          if (updatedProds) dispatch({ type: 'SET_PRODUCTS', payload: updatedProds });
          if (updatedMoves) dispatch({ type: 'SET_MOVEMENTS', payload: updatedMoves });
          if (updatedCash) dispatch({ type: 'SET_CASH_MOVEMENTS', payload: updatedCash });
          return created;
        }
      } catch (err) {
        console.warn('Fallo al registrar compra en backend:', err);
      }
    }
    dispatch({ type: 'ADD_PURCHASE', payload: purchaseData });
  };

  const cancelPurchase = async (id) => {
    if (backendOnline) {
      try {
        await api.cancelPurchase(id);
        const [updatedProds, updatedMoves, updatedCash] = await Promise.all([
          api.getProducts().catch(() => null),
          api.getMovements().catch(() => null),
          api.getCashMovements().catch(() => null),
        ]);
        if (updatedProds) dispatch({ type: 'SET_PRODUCTS', payload: updatedProds });
        if (updatedMoves) dispatch({ type: 'SET_MOVEMENTS', payload: updatedMoves });
        if (updatedCash) dispatch({ type: 'SET_CASH_MOVEMENTS', payload: updatedCash });
      } catch (err) {
        console.warn('Fallo al anular compra en backend:', err);
      }
    }
    dispatch({ type: 'CANCEL_PURCHASE', payload: id });
  };

  const getNextPurchaseNumber = () => {
    const maxNum = (state.purchases || []).reduce((max, p) => {
      const parts = (p.purchaseNumber || '').split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `COM-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Operaciones de Proveedores
  const addSupplier = async (supplierData) => {
    if (backendOnline) {
      try {
        const created = await api.createSupplier(supplierData);
        if (created) {
          dispatch({ type: 'ADD_SUPPLIER', payload: created });
          return created;
        }
      } catch (err) {
        console.warn('Fallo al guardar proveedor en backend:', err);
      }
    }
    dispatch({ type: 'ADD_SUPPLIER', payload: supplierData });
  };

  const updateSupplier = async (id, updates) => {
    if (backendOnline) {
      try {
        await api.updateSupplier(id, updates);
      } catch (err) {
        console.warn('Fallo al actualizar proveedor en backend:', err);
      }
    }
    dispatch({ type: 'UPDATE_SUPPLIER', payload: { id, updates } });
  };

  const deleteSupplier = async (id) => {
    if (backendOnline) {
      try {
        await api.deleteSupplier(id);
      } catch (err) {
        console.warn('Fallo al eliminar proveedor en backend:', err);
      }
    }
    dispatch({ type: 'DELETE_SUPPLIER', payload: id });
  };

  const getNextSupplierCode = () => {
    const maxNum = (state.suppliers || []).reduce((max, s) => {
      const parts = (s.code || '').split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `PROV-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Operaciones de Categorías & Subcategorías
  const addCategory = async (categoryData) => {
    if (backendOnline) {
      try {
        const created = await api.createCategory(categoryData);
        if (created) {
          dispatch({ type: 'ADD_CATEGORY', payload: created });
          return created;
        }
      } catch (err) {
        console.warn('Fallo al guardar categoría en backend:', err);
      }
    }
    dispatch({ type: 'ADD_CATEGORY', payload: categoryData });
  };

  const updateCategory = async (id, data) => {
    if (backendOnline) {
      try {
        await api.updateCategory(id, data);
      } catch (err) {
        console.warn('Fallo al actualizar categoría en backend:', err);
      }
    }
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, data } });
  };

  const deleteCategory = async (id) => {
    if (backendOnline) {
      try {
        await api.deleteCategory(id);
      } catch (err) {
        console.warn('Fallo al eliminar categoría en backend:', err);
      }
    }
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  const addSubcategory = (categoryId, subcategory) => {
    dispatch({ type: 'ADD_SUBCATEGORY', payload: { categoryId, subcategory } });
  };

  const updateSubcategory = (categoryId, oldName, newName) => {
    dispatch({ type: 'UPDATE_SUBCATEGORY', payload: { categoryId, oldName, newName } });
  };

  const deleteSubcategory = (categoryId, subcategory) => {
    dispatch({ type: 'DELETE_SUBCATEGORY', payload: { categoryId, subcategory } });
  };

  return (
    <AppContext.Provider
      value={{
        products: state.products,
        sales: state.sales,
        movements: state.movements,
        cashMovements: state.cashMovements,
        categories: state.categories || initialCategories,
        suppliers: state.suppliers || initialSuppliers,
        purchases: state.purchases || initialPurchases,
        backendOnline,
        currentUser,
        login,
        logout,
        currentTheme,
        changeTheme,
        themeMode,
        toggleThemeMode,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addSale,
        cancelSale,
        addCashMovement,
        getCashBalance,
        resetAllData,
        getNextCode,
        getNextSaleNumber,
        getStats,
        exportProductsCSV,
        exportSalesCSV,
        addPurchase,
        cancelPurchase,
        getNextPurchaseNumber,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getNextSupplierCode,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
