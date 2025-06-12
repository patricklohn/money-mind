import { Router } from 'express';
import authRoutes from './auth';
import transactionRoutes from './transactions';
import goalRoutes from './goals';
import walletRoutes from './wallets';
import categoryRoutes from './categories';
import dashboardRoutes from './dashboard';

const router = Router();

// Registrar todas as rotas
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/goals', goalRoutes);
router.use('/wallets', walletRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
