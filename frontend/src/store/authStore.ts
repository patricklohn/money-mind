import create from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Interface para o usuário
interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  mfaEnabled: boolean;
  profileImage?: string;
}

// Interface para o estado de autenticação
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Ações
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyMfa: (token: string, code: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Store de autenticação
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Login
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await api.post('/auth/login', { email, password });
          const { token, user, mfaRequired, mfaToken } = response.data;
          
          // Se MFA for necessário, retornar sem autenticar
          if (mfaRequired) {
            set({ 
              isLoading: false,
              token: mfaToken,
              isAuthenticated: false
            });
            return;
          }
          
          // Autenticar usuário
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Configurar token no cabeçalho das requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Falha ao fazer login' 
          });
          throw error;
        }
      },
      
      // Registro
      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await api.post('/auth/register', { name, email, password });
          const { token, user } = response.data;
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Configurar token no cabeçalho das requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Falha ao registrar' 
          });
          throw error;
        }
      },
      
      // Logout
      logout: () => {
        // Remover token do cabeçalho das requisições
        delete api.defaults.headers.common['Authorization'];
        
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      // Verificar MFA
      verifyMfa: async (token: string, code: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await api.post('/auth/verify-mfa', { token, code });
          const { token: newToken, user } = response.data;
          
          set({ 
            token: newToken, 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Configurar token no cabeçalho das requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Código MFA inválido' 
          });
          throw error;
        }
      },
      
      // Atualizar dados do usuário
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      }
    }),
    {
      name: 'moneymind-auth',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
