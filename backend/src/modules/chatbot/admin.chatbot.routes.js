import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './chatbot.controller.js';
import {
  testChatbotConnectionSchema,
  updateChatbotConfigSchema,
} from './chatbot.validation.js';

const router = Router();

router.get('/chatbot/config', controller.getAdminConfig);
router.put('/chatbot/config', validate(updateChatbotConfigSchema), controller.updateAdminConfig);
router.post(
  '/chatbot/test-connection',
  validate(testChatbotConnectionSchema),
  controller.testAdminConnection
);
router.get('/chatbot/stats', controller.getAdminStats);

export default router;
