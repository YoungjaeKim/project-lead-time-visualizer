import { Router } from 'express';
import workspaceRoutes from './workspaces';
import projectRoutes from './projects';
import eventRoutes from './events';
import userRoutes from './users';
import organizationRoutes from './organizations';
import participantRoutes from './participants';
import externalSourceRoutes from './external-sources';

const router = Router();

router.use('/workspaces', workspaceRoutes);
router.use('/projects', projectRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/api', participantRoutes);
router.use('/external-sources', externalSourceRoutes);

export default router;