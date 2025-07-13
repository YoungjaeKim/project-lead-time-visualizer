import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventsByDateRange
} from '../controllers';

const router = Router();

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/date-range', getEventsByDateRange);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.patch('/:id/status', updateEventStatus);

export default router;