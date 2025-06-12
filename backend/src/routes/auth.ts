import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { protect } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-mfa', AuthController.verifyMfa);

// Rotas protegidas
router.use(protect); // Middleware de autenticação

router.get('/profile', AuthController.getProfile);
router.patch('/profile', AuthController.updateProfile);
router.patch('/change-password', AuthController.changePassword);
router.post('/setup-mfa', AuthController.setupMfa);
router.post('/enable-mfa', AuthController.enableMfa);
router.post('/disable-mfa', AuthController.disableMfa);

export default router;
