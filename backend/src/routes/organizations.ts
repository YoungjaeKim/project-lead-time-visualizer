import { Router } from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  getOrganizationHierarchy
} from '../controllers';

const router = Router();

router.post('/', createOrganization);
router.get('/', getOrganizations);
router.get('/hierarchy', getOrganizationHierarchy);
router.get('/:id', getOrganizationById);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);
router.post('/:organizationId/members/:userId', addMember);
router.delete('/:organizationId/members/:userId', removeMember);

export default router;