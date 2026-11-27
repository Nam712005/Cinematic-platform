import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './comments.controller.js';
import { updateCommentStatusSchema } from './comments.validation.js';

const router = Router();

router.get('/comments', controller.listCommentsAdmin);
router.patch('/comments/:id/status', validate(updateCommentStatusSchema), controller.moderateComment);

export default router;
