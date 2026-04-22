import express from 'express';
import { saveToken, deleteToken } from '../controllers/pushcontroler.controller';

const router = express.Router();

router.post('/save-token', saveToken);
router.post('/delete-token', deleteToken);

export default router;