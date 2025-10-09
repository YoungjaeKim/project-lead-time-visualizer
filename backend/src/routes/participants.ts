import { Router } from 'express';
import {
  createParticipant,
  getProjectParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant,
  addMemberToParticipant,
  updateMemberRoles,
  removeMemberFromParticipant
} from '../controllers/ParticipantController';

const router = Router();

// Participant group CRUD
router.post('/projects/:projectId/participants', createParticipant);
router.get('/projects/:projectId/participants', getProjectParticipants);
router.get('/participants/:id', getParticipantById);
router.put('/participants/:id', updateParticipant);
router.delete('/participants/:id', deleteParticipant);

// Member management within participant groups
router.post('/participants/:participantId/members', addMemberToParticipant);
router.put('/participants/:participantId/members/:userId', updateMemberRoles);
router.delete('/participants/:participantId/members/:userId', removeMemberFromParticipant);

export default router;

