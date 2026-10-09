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
