import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erro de autenticação
    if (error.response?.status === 401) {
      // Se não for uma rota de autenticação, fazer logout
      if (!error.config.url.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  verifyMfa: async (token: string, code: string) => {
    const response = await api.post('/auth/verify-mfa', { token, code });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.patch('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  
  setupMfa: async () => {
    const response = await api.post('/auth/setup-mfa');
    return response.data;
  },
  
  enableMfa: async (code: string) => {
    const response = await api.post('/auth/enable-mfa', { code });
    return response.data;
  },
  
  disableMfa: async (password: string) => {
    const response = await api.post('/auth/disable-mfa', { password });
    return response.data;
  }
};

// Serviços de transações
export const transactionService = {
  getAll: async (params?: any) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.patch(`/transactions/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  
  getMonthlySummary: async (year?: number, month?: number) => {
    const params = { year, month };
    const response = await api.get('/transactions/summary/monthly', { params });
    return response.data;
  },
  
  getCategorySummary: async (params?: any) => {
    const response = await api.get('/transactions/summary/category', { params });
    return response.data;
  }
};

// Serviços de metas
export const goalService = {
  getAll: async () => {
    const response = await api.get('/goals');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/goals', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.patch(`/goals/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },
  
  contribute: async (id: number, amount: number) => {
    const response = await api.post(`/goals/${id}/contribute`, { amount });
    return response.data;
  }
};

// Serviços de carteiras
export const walletService = {
  getAll: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/wallets', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.patch(`/wallets/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/wallets/${id}`);
    return response.data;
  },
  
  adjustBalance: async (id: number, balance: number) => {
    const response = await api.patch(`/wallets/${id}/balance`, { balance });
    return response.data;
  }
};

// Serviços de categorias
export const categoryService = {
  getAll: async (type?: string) => {
    const params = { type };
    const response = await api.get('/categories', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }
};

// Serviço de dashboard
export const dashboardService = {
  getData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  }
};

export default api;
