import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  // Verificar se o usuário está autenticado
  if (!token) {
    // Redirecionar para a página de login, salvando a localização atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se estiver autenticado, renderizar o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
