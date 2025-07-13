import { Router } from 'express';
import workspaceRoutes from './workspaces';
import projectRoutes from './projects';
import eventRoutes from './events';
import userRoutes from './users';
import organizationRoutes from './organizations';
import externalSourceRoutes from './external-sources';

const router = Router();

router.use('/workspaces', workspaceRoutes);
router.use('/projects', projectRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/external-sources', externalSourceRoutes);

export default router;