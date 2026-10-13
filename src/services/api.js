// =========================================================
// DASSEL SANDALS - API CLIENT (NestJS + PostgreSQL + Prisma)
// =========================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error en la petición: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[API Warning] Fallo de conexión con backend (${endpoint}):`, error.message);
    throw error;
  }
}

export const api = {
  // Productos / Inventario
  async getProducts(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.stock && params.stock !== 'all') searchParams.set('stock', params.stock);

    const qs = searchParams.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },

  async getProduct(id) {
    return request(`/products/${id}`);
  },

  async getNextProductCode(category) {
    return request(`/products/next-code/${category}`);
  },

  async createProduct(productData) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, updates) {
    return request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async adjustStock(id, quantity, reason, size, sizesStock) {
    return request(`/products/${id}/adjust-stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, reason, size, sizesStock }),
    });
  },

  async deleteProduct(id) {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Ventas (POS)
  async getSales(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.paymentMethod && params.paymentMethod !== 'all') searchParams.set('paymentMethod', params.paymentMethod);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);

    const qs = searchParams.toString();
    return request(`/sales${qs ? `?${qs}` : ''}`);
  },

  async getNextSaleNumber() {
    return request('/sales/next-number');
  },

  async createSale(saleData) {
    return request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  async cancelSale(id) {
    return request(`/sales/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // Kardex / Auditoría de Movimientos
  async getMovements(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.type && params.type !== 'all') searchParams.set('type', params.type);

    const qs = searchParams.toString();
    return request(`/movements${qs ? `?${qs}` : ''}`);
  },

  // Dashboard & Métricas
  async getDashboardStats() {
    return request('/dashboard/stats');
  },

  // Proveedores
  async getSuppliers(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);

    const qs = searchParams.toString();
    return request(`/suppliers${qs ? `?${qs}` : ''}`);
  },

  async getNextSupplierCode() {
    return request('/suppliers/next-code');
  },

  async createSupplier(supplierData) {
    return request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  async updateSupplier(id, updates) {
    return request(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteSupplier(id) {
    return request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },

  // Compras de Mercancía
  async getPurchases(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.supplierId) searchParams.set('supplierId', params.supplierId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);

    const qs = searchParams.toString();
    return request(`/purchases${qs ? `?${qs}` : ''}`);
  },

  async getNextPurchaseNumber() {
    return request('/purchases/next-number');
  },

  async createPurchase(purchaseData) {
    return request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  },

  async cancelPurchase(id) {
    return request(`/purchases/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // Categorías
  async getCategories() {
    return request('/categories');
  },

  async createCategory(categoryData) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  async updateCategory(id, updates) {
    return request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Movimientos de Caja Chica
  async getCashMovements(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);

    const qs = searchParams.toString();
    return request(`/cash-movements${qs ? `?${qs}` : ''}`);
  },

  async getCashSummary() {
    return request('/cash-movements/summary');
  },

  async createCashMovement(movementData) {
    const rawType = String(movementData.type || '').toLowerCase();
    const type = rawType === 'salida' ? 'egreso' : rawType === 'entrada' ? 'ingreso' : rawType;
    const reason = movementData.reason || movementData.description || movementData.category || 'Movimiento de caja';
    const notes = movementData.notes || movementData.category || null;

    const payload = {
      type,
      amount: Number(movementData.amount),
      reason,
      notes,
      category: movementData.category || notes,
      description: movementData.description || reason,
      responsible: movementData.responsible || 'Administración',
      date: movementData.date || new Date().toISOString(),
    };

    return request('/cash-movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Autenticación de Usuarios
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getProfile(userId) {
    return request(`/auth/profile/${userId}`);
  },

  // Health check del backend
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/products?search=ping`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },
};
