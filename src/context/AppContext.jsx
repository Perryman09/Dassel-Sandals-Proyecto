import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { api } from '../services/api';
import { applyTheme, THEMES } from '../utils/theme';

const AppContext = createContext();

export const SUBCATEGORIES = {
  zapatos: ['Sandalias', 'Huaraches', 'Plataformas', 'Flats', 'Tacones', 'Otro'],
  joyas: ['Collares', 'Pulseras', 'Aretes', 'Anillos', 'Tobilleras', 'Dijes', 'Otro'],
};

// Tallas estándar para calzado
export const SHOE_SIZES = ['22', '22.5', '23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', '28'];

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
    size: '22-26',
    sizesStock: { '22': 2, '23': 6, '24': 10, '25': 5, '26': 2 },
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
    size: '24-28',
    sizesStock: { '24': 4, '25': 5, '26': 5, '27': 3, '28': 1 },
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
    size: '22-26',
    sizesStock: { '22': 6, '23': 10, '24': 14, '25': 8, '26': 2 },
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
    size: '23-26',
    sizesStock: { '23': 2, '24': 5, '25': 4, '26': 1 },
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
    size: '22-27',
    sizesStock: { '23': 1, '24': 1, '25': 1 },
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
    size: '24-28',
    sizesStock: { '24': 0, '25': 0, '26': 0, '27': 0, '28': 0 },
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
    size: '22-26',
    sizesStock: { '22': 1, '23': 2, '24': 3, '25': 2 },
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

    case 'RESET_ALL':
      return {
        products: initialProducts,
        sales: initialSales,
        movements: initialMovements,
        cashMovements: initialCashMovements,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [backendOnline, setBackendOnline] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('amber');
  const [themeMode, setThemeMode] = useState('dark');

  const [state, dispatch] = useReducer(appReducer, null, () => ({
    products: loadSavedData('products', initialProducts),
    sales: loadSavedData('sales', initialSales),
    movements: loadSavedData('movements', initialMovements),
    cashMovements: loadSavedData('cash_movements', initialCashMovements),
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
          const [dbProducts, dbSales, dbMovements] = await Promise.all([
            api.getProducts().catch(() => null),
            api.getSales().catch(() => null),
            api.getMovements().catch(() => null),
          ]);
          if (dbProducts && Array.isArray(dbProducts)) dispatch({ type: 'SET_PRODUCTS', payload: dbProducts });
          if (dbSales && Array.isArray(dbSales)) dispatch({ type: 'SET_SALES', payload: dbSales });
          if (dbMovements && Array.isArray(dbMovements)) dispatch({ type: 'SET_MOVEMENTS', payload: dbMovements });
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

  const addCashMovement = (data) => {
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

  return (
    <AppContext.Provider
      value={{
        products: state.products,
        sales: state.sales,
        movements: state.movements,
        cashMovements: state.cashMovements,
        backendOnline,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
