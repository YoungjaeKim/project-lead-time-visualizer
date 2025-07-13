import { Router } from 'express';
import {
  createExternalSourceConfig,
  getExternalSourceConfigs,
  getExternalSourceConfigById,
  updateExternalSourceConfig,
  deleteExternalSourceConfig,
  testConnection,
  triggerSync,
  triggerAllSync
} from '../controllers/ExternalSourceController';

const router = Router();

router.post('/', createExternalSourceConfig);
router.get('/', getExternalSourceConfigs);
router.get('/:id', getExternalSourceConfigById);
router.put('/:id', updateExternalSourceConfig);
router.delete('/:id', deleteExternalSourceConfig);
router.post('/:id/test', testConnection);
router.post('/:id/sync', triggerSync);
router.post('/sync-all', triggerAllSync);

export default router;