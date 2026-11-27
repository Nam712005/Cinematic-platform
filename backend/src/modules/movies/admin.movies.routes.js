import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './movies.controller.js';
import { importNguonCMovieSchema, manualMovieSchema } from './movies.validation.js';

const router = Router();

// Multi-Provider API Search & Preview (NguonC / KKPhim / OPhim + Link URL)
router.get('/nguonc/search', controller.searchNguonC);
router.get('/nguonc/preview-url', controller.previewMovieByUrl);
router.get('/nguonc/preview/:slugOrId', controller.previewNguonC);

// Movies CRUD & Import (Admin UI16)
router.get('/movies', controller.listMoviesAdmin);
router.post('/movies/import-nguonc', validate(importNguonCMovieSchema), controller.importNguonC);
router.get('/movies/:id', controller.getMovieAdmin);
router.post('/movies', validate(manualMovieSchema), controller.createManualMovie);
router.put('/movies/:id', validate(manualMovieSchema), controller.updateMovieAdmin);
router.delete('/movies/:id', controller.deleteMovieAdmin);

export default router;
