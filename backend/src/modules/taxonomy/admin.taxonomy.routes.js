import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './taxonomy.controller.js';
import { categorySchema, countrySchema, genreSchema, personSchema } from './taxonomy.validation.js';

const router = Router();

// Categories (UI18)
router.get('/categories', controller.listCategories);
router.get('/categories/:id', controller.getCategory);
router.post('/categories', validate(categorySchema), controller.createCategory);
router.put('/categories/:id', validate(categorySchema), controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

// Genres
router.get('/genres', controller.listGenres);
router.post('/genres', validate(genreSchema), controller.createGenre);
router.put('/genres/:id', validate(genreSchema), controller.updateGenre);
router.delete('/genres/:id', controller.deleteGenre);

// Countries
router.get('/countries', controller.listCountries);
router.post('/countries', validate(countrySchema), controller.createCountry);
router.put('/countries/:id', validate(countrySchema), controller.updateCountry);
router.delete('/countries/:id', controller.deleteCountry);

// Actors
router.get('/actors', controller.listActors);
router.post('/actors', validate(personSchema), controller.createActor);
router.put('/actors/:id', validate(personSchema), controller.updateActor);
router.delete('/actors/:id', controller.deleteActor);

// Directors
router.get('/directors', controller.listDirectors);
router.post('/directors', validate(personSchema), controller.createDirector);
router.put('/directors/:id', validate(personSchema), controller.updateDirector);
router.delete('/directors/:id', controller.deleteDirector);

export default router;
