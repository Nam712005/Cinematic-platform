import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware.js';
import * as controller from './movies.controller.js';

const router = Router();

router.get('/home', controller.getHome);
router.get('/', controller.searchMovies);
router.get('/:slug/watch/:episodeSlug', optionalAuth, controller.watchEpisode);
router.get('/:slug', optionalAuth, controller.getMovieDetail);
router.post('/:id/like', authenticate, controller.likeMovie);

export default router;
