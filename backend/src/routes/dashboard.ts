import { Router } from 'express';
import DashboardController from '../controllers/DashboardController';
import { protect } from '../middlewares/auth';

const router = Router();

// Todas as rotas do dashboard são protegidas
router.use(protect);

// Rota para obter dados do dashboard
router.get('/', DashboardController.getDashboardData);

export default router;
