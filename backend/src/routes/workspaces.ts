import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addProjectToWorkspace,
  removeProjectFromWorkspace
} from '../controllers';

const router = Router();

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:workspaceId/projects/:projectId', addProjectToWorkspace);
router.delete('/:workspaceId/projects/:projectId', removeProjectFromWorkspace);

export default router;