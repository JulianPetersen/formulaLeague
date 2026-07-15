import { Router } from 'express';
import * as raffleCtrl from '../controllers/raffle.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import upload from '../middlewares/upload.middleware';

const router = Router();
const adminRoles = ['admin', 'moderator'];

router.get('/', authMiddleware, raffleCtrl.getRaffles);
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware(adminRoles),
  raffleCtrl.getAdminRaffles
);
router.get('/my-tickets', authMiddleware, raffleCtrl.getMyTickets);
router.get('/my-prizes', authMiddleware, raffleCtrl.getMyPrizes);
router.get('/winners', authMiddleware, raffleCtrl.getRecentWinners);
router.get('/:id', authMiddleware, raffleCtrl.getRaffleById);
router.post('/:id/tickets', authMiddleware, raffleCtrl.buyTickets);
router.post('/:id/claim', authMiddleware, raffleCtrl.claimPrize);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(adminRoles),
  upload.single('img'),
  raffleCtrl.createRaffle
);

router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(adminRoles),
  upload.single('img'),
  raffleCtrl.updateRaffle
);

router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(adminRoles),
  raffleCtrl.updateRaffleStatus
);

router.post(
  '/:id/draw',
  authMiddleware,
  roleMiddleware(adminRoles),
  raffleCtrl.drawRaffle
);

export default router;
