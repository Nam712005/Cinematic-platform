import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as controller from './favorites.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listMyFavorites);
router.post('/:movieId', controller.addFavorite);
router.delete('/:movieId', controller.removeFavorite);
router.delete('/', controller.clearAllFavorites);

export default router;
