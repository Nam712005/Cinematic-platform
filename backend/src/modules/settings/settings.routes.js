import { Router } from 'express';
import { fetchPublicSettings } from './settings.controller.js';

const router = Router();

router.get('/public', fetchPublicSettings);

export default router;
