import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import authRoutes from '../modules/auth/auth.routes.js';
import adminChatbotRoutes from '../modules/chatbot/admin.chatbot.routes.js';
import chatbotRoutes from '../modules/chatbot/chatbot.routes.js';
import adminCommentsRoutes from '../modules/comments/admin.comments.routes.js';
import commentsRoutes from '../modules/comments/comments.routes.js';
import adminDashboardRoutes from '../modules/dashboard/admin.dashboard.routes.js';
import adminEpisodesRoutes from '../modules/episodes/admin.episodes.routes.js';
import favoritesRoutes from '../modules/favorites/favorites.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import adminMoviesRoutes from '../modules/movies/admin.movies.routes.js';
import moviesRoutes from '../modules/movies/movies.routes.js';
import adminPremiumRoutes from '../modules/premium/admin.premium.routes.js';
import premiumRoutes from '../modules/premium/premium.routes.js';
import ratingsRoutes from '../modules/ratings/ratings.routes.js';
import adminReportsRoutes from '../modules/reports/admin.reports.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';
import adminSettingsRoutes from '../modules/settings/admin.settings.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import adminTaxonomyRoutes from '../modules/taxonomy/admin.taxonomy.routes.js';
import taxonomyRoutes from '../modules/taxonomy/taxonomy.routes.js';
import adminUsersRoutes from '../modules/users/admin.users.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import watchHistoryRoutes from '../modules/watchHistory/watchHistory.routes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

// Public & Authenticated Client Routes
router.use('/health', healthRoutes);
router.use('/settings', settingsRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/taxonomy', taxonomyRoutes);
router.use('/movies', moviesRoutes);
router.use('/watch-histories', watchHistoryRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/', ratingsRoutes);
router.use('/', commentsRoutes);
router.use('/', reportsRoutes);
router.use('/', premiumRoutes);

// Admin Routes (Strictly Protected by authenticate + requireRole('ADMIN'))
const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/ping', (req, res) => {
  return sendSuccess(res, {
    message: 'Xác thực quyền Quản trị viên thành công.',
    data: {
      adminId: req.user.id,
      role: req.user.role,
    },
  });
});

adminRouter.use('/', adminTaxonomyRoutes);
adminRouter.use('/', adminMoviesRoutes);
adminRouter.use('/', adminEpisodesRoutes);
adminRouter.use('/', adminCommentsRoutes);
adminRouter.use('/', adminReportsRoutes);
adminRouter.use('/', adminPremiumRoutes);
adminRouter.use('/', adminChatbotRoutes);
adminRouter.use('/', adminUsersRoutes);
adminRouter.use('/', adminDashboardRoutes);
adminRouter.use('/', adminSettingsRoutes);

router.use('/admin', adminRouter);

export default router;
