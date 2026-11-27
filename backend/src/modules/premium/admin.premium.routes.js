import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './premium.controller.js';
import { premiumPlanSchema, refundTransactionSchema } from './premium.validation.js';

const router = Router();

// Premium Plans CRUD (UI20)
router.get('/premium-plans', controller.listPlansAdmin);
router.post('/premium-plans', validate(premiumPlanSchema), controller.createPlanAdmin);
router.put('/premium-plans/:id', validate(premiumPlanSchema), controller.updatePlanAdmin);
router.patch('/premium-plans/:id/popular', controller.setPopularPlanAdmin);
router.delete('/premium-plans/:id', controller.deletePlanAdmin);

// Transactions & Simulated Refund (UI21)
router.get('/transactions', controller.listTransactionsAdmin);
router.get('/transactions/:id', controller.getTransactionDetailAdmin);
router.post(
  '/transactions/:id/refund',
  validate(refundTransactionSchema),
  controller.refundTransactionAdmin
);

export default router;
