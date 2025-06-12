import { Router } from 'express';
import WalletController from '../controllers/WalletController';
import { protect } from '../middlewares/auth';

const router = Router();

// Todas as rotas de carteiras são protegidas
router.use(protect);

// Rotas CRUD
router.get('/', WalletController.getAllWallets);
router.post('/', WalletController.createWallet);
router.get('/:id', WalletController.getWalletById);
router.patch('/:id', WalletController.updateWallet);
router.delete('/:id', WalletController.deleteWallet);

// Rota para ajustar saldo
router.patch('/:id/balance', WalletController.adjustBalance);

export default router;
