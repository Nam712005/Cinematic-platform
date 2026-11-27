import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './comments.controller.js';
import { createCommentSchema } from './comments.validation.js';

const router = Router();

router.get('/movies/:movieId/comments', optionalAuth, controller.listMovieComments);
router.post(
  '/movies/:movieId/comments',
  authenticate,
  validate(createCommentSchema),
  controller.createMovieComment
);
router.post('/comments/:id/like', authenticate, controller.toggleLike);
router.delete('/comments/:id', authenticate, controller.deleteComment);

export default router;
