import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectCostAnalysis
} from '../controllers';

const router = Router();

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/cost-analysis', getProjectCostAnalysis);

// Note: Participant management is now handled through /api/participants routes
// See participants.ts for participant group and member management

export default router;