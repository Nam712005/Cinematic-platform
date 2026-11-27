import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './chatbot.controller.js';
import { createSessionSchema, sendMessageSchema } from './chatbot.validation.js';

const router = Router();

// Strictly authenticated members only (Guests get 401 -> UI prompts Login/Register)
router.use(authenticate);

router.get('/sessions', controller.listMySessions);
router.post('/sessions', validate(createSessionSchema), controller.createMySession);
router.get('/sessions/:id/messages', controller.getSessionMessages);
router.delete('/sessions/:id', controller.deleteMySession);
router.post('/sessions/:id/messages', validate(sendMessageSchema), controller.sendMessage);

export default router;
