import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './ratings.controller.js';
import { upsertRatingSchema } from './ratings.validation.js';

const router = Router();

router.get('/movies/:movieId/ratings', controller.getMovieRatings);
router.put('/movies/:movieId/ratings', authenticate, validate(upsertRatingSchema), controller.upsertMyRating);

export default router;
