import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './watchHistory.controller.js';
import { upsertProgressSchema } from './watchHistory.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listMyHistory);
router.get('/episode/:episodeId', controller.getEpisodeProgress);
router.put('/progress', validate(upsertProgressSchema), controller.upsertProgress);
// POST alias to support fetch(..., { keepalive: true }) on browser/tab close
router.post('/progress', validate(upsertProgressSchema), controller.upsertProgress);
router.delete('/:id', controller.deleteHistoryItem);
router.delete('/', controller.clearAllHistory);

export default router;
