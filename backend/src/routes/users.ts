import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByOrganization,
  getUsersBySkill
} from '../controllers';

const router = Router();

router.post('/', createUser);
router.get('/', getUsers);
router.get('/organization/:organizationId', getUsersByOrganization);
router.get('/skill/:skill', getUsersBySkill);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;