import { Router } from 'express';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './reports.controller.js';
import { createReportSchema } from './reports.validation.js';

const router = Router();

router.post(
  '/movies/:movieId/reports',
  optionalAuth,
  validate(createReportSchema),
  controller.submitReport
);

export default router;
