import { Request, Response } from 'express';
import { Event, Project } from '../models';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    await Project.findByIdAndUpdate(
      event.projectId,
      { $push: { events: event._id } }
    );
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const filter = projectId ? { projectId } : {};
    
    const events = await Event.find(filter)
      .populate('projectId', 'name')
      .populate('participants', 'name email role');
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('projectId', 'name status')
      .populate('participants', 'name email role skills dailyFee level');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await Project.findByIdAndUpdate(
      event.projectId,
      { $pull: { events: event._id } }
    );
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['done', 'ongoing', 'notyet'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getEventsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    const filter: any = {};
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.startDate.$lte = new Date(endDate as string);
      }
    }
    
    const events = await Event.find(filter)
      .populate('projectId', 'name')
      .populate('participants', 'name email')
      .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};