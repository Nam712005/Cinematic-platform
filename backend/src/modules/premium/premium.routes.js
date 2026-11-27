import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './premium.controller.js';
import { checkoutPreviewSchema, completeMockPaymentSchema } from './premium.validation.js';

const router = Router();

// Public plans (UI12)
router.get('/premium-plans', controller.getPublicPlans);

// Authenticated Member Checkout & Orders (UI13, UI14, UI28)
router.post(
  '/orders/checkout-preview',
  authenticate,
  validate(checkoutPreviewSchema),
  controller.checkoutPreview
);
router.post(
  '/orders/complete-mock-payment',
  authenticate,
  validate(completeMockPaymentSchema),
  controller.completeMockPayment
);
router.get('/orders/my-orders', authenticate, controller.getMyOrderHistory);
router.get('/orders/:orderCode/result', authenticate, controller.getOrderResult);

export default router;
