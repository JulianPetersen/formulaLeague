import { Router } from 'express';
import * as walletCtrl from '../controllers/wallet.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authMiddleware, walletCtrl.getWallet);
router.post('/claim', authMiddleware, walletCtrl.requestClaim);
router.get(
  '/claims',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  walletCtrl.getClaims
);
router.patch(
  '/claims/:id',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  walletCtrl.updateClaimStatus
);

export default router;
