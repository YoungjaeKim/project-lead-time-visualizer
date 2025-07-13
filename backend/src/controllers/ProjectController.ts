import { Request, Response } from 'express';
import { Project, Event, User } from '../models';

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .populate('participants', 'name email role dailyFee')
      .populate('events', 'title status startDate endDate');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('participants', 'name email role skills dailyFee level')
      .populate({
        path: 'events',
        populate: {
          path: 'participants',
          select: 'name email role'
        }
      });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await Event.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    
    const project = await Project.findById(projectId);
    const user = await User.findById(userId);
    
    if (!project || !user) {
      return res.status(404).json({ error: 'Project or User not found' });
    }
    
    if (!project.participants.includes(userId as any)) {
      project.participants.push(userId as any);
      await project.save();
    }
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.participants = project.participants.filter(
      (id) => id.toString() !== userId
    );
    await project.save();
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getProjectCostAnalysis = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('participants', 'name dailyFee level')
      .populate('events', 'title actualHours estimatedHours participants');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const costAnalysis = {
      estimatedCost: project.estimatedCost || 0,
      actualCost: project.actualCost || 0,
      budget: project.budget || 0,
      participantCosts: project.participants.map((participant: any) => ({
        name: participant.name,
        dailyFee: participant.dailyFee,
        level: participant.level
      }))
    };
    
    res.json(costAnalysis);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};