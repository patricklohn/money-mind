import { Router } from 'express';
import GoalController from '../controllers/GoalController';
import { protect } from '../middlewares/auth';

const router = Router();

// Todas as rotas de metas são protegidas
router.use(protect);

// Rotas CRUD
router.get('/', GoalController.getAllGoals);
router.post('/', GoalController.createGoal);
router.get('/:id', GoalController.getGoalById);
router.patch('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// Rota para contribuir para uma meta
router.post('/:id/contribute', GoalController.contributeToGoal);

export default router;
