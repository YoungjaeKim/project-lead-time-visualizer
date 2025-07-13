import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addParticipant,
  removeParticipant,
  getProjectCostAnalysis
} from '../controllers';

const router = Router();

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/cost-analysis', getProjectCostAnalysis);
router.post('/:projectId/participants/:userId', addParticipant);
router.delete('/:projectId/participants/:userId', removeParticipant);

export default router;