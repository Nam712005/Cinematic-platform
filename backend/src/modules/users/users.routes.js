import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadAvatarMiddleware } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as usersController from './users.controller.js';
import { changePasswordSchema, updateProfileSchema } from './users.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMyProfile);
router.put('/me', validate(updateProfileSchema), usersController.updateMyProfile);
router.post('/me/avatar', uploadAvatarMiddleware, usersController.updateMyAvatar);
router.put('/me/password', validate(changePasswordSchema), usersController.changeMyPassword);

export default router;
