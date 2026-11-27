import { Router } from 'express';
import * as controller from './reports.controller.js';

const router = Router();

router.get('/movie-reports', controller.listReportsAdmin);
router.patch('/movie-reports/:id/resolve', controller.resolveReport);

export default router;
