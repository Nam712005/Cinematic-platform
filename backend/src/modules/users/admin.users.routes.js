import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './admin.users.controller.js';
import {
  adminCreateUserSchema,
  adminToggleUserStatusSchema,
  adminUpdateUserSchema,
} from './admin.users.validation.js';

const router = Router();

router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserDetail);
router.post('/users', validate(adminCreateUserSchema), controller.createUser);
router.put('/users/:id', validate(adminUpdateUserSchema), controller.updateUser);
router.patch(
  '/users/:id/status',
  validate(adminToggleUserStatusSchema),
  controller.toggleUserStatus
);

export default router;
