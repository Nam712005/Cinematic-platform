import { Router } from 'express';
import * as controller from './taxonomy.controller.js';

const router = Router();

router.get('/filters', controller.getPublicFilters);

export default router;
