import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './episodes.controller.js';
import { episodeSchema, videoSourceSchema } from './episodes.validation.js';

const router = Router();

// Episodes by movie (UI17)
router.get('/movies/:movieId/episodes', controller.listEpisodesByMovie);
router.post('/movies/:movieId/episodes', validate(episodeSchema), controller.createEpisode);
router.put('/episodes/:id', validate(episodeSchema), controller.updateEpisode);
router.delete('/episodes/:id', controller.deleteEpisode);

// Video sources by episode (UI17)
router.get('/episodes/:episodeId/sources', controller.listSourcesByEpisode);
router.post('/episodes/:episodeId/sources', validate(videoSourceSchema), controller.createSource);
router.put('/sources/:id', validate(videoSourceSchema), controller.updateSource);
router.delete('/sources/:id', controller.deleteSource);

export default router;
