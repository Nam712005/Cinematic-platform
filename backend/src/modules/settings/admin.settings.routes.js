import { Router } from 'express';
import { uploadSiteAssetMiddleware } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './settings.controller.js';
import { updateSystemSettingsSchema } from './settings.validation.js';

const router = Router();

router.get('/settings', controller.fetchAdminSettings);
router.put('/settings', validate(updateSystemSettingsSchema), controller.saveAdminSettings);
router.post('/settings/reset', controller.restoreDefaultSettings);
router.post('/settings/upload-asset', uploadSiteAssetMiddleware, controller.uploadSiteAsset);

export default router;
