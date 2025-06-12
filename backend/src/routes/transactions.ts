import { Router } from 'express';
import TransactionController from '../controllers/TransactionController';
import { protect } from '../middlewares/auth';

const router = Router();

// Todas as rotas de transações são protegidas
router.use(protect);

// Rotas de resumo
router.get('/summary/monthly', TransactionController.getMonthlyTransactionSummary);
router.get('/summary/category', TransactionController.getCategorySummary);

// Rotas CRUD
router.get('/', TransactionController.getAllTransactions);
router.post('/', TransactionController.createTransaction);
router.get('/:id', TransactionController.getTransactionById);
router.patch('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);

export default router;
