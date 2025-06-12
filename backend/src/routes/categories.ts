import { Router } from 'express';
import CategoryController from '../controllers/CategoryController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Rotas públicas para leitura
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Rotas protegidas para administradores
router.use(protect);
router.use(restrictTo);

// Rotas CRUD para administradores
router.post('/', CategoryController.createCategory);
router.patch('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;
