import { Request, Response } from 'express';
import { Project, Event, Participant } from '../models';

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
      .populate({
        path: 'participants',
        populate: {
          path: 'members.user',
          select: 'name email role dailyFee'
        }
      })
      .populate('events', 'title status startDate endDate');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'participants',
        populate: {
          path: 'members.user',
          select: 'name email role skills dailyFee level'
        }
      })
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
    
    // Clean up related data
    await Event.deleteMany({ projectId: req.params.id });
    await Participant.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Note: Participant management is now handled through ParticipantController
// Use the /api/participants/:participantId/members endpoints instead

export const getProjectCostAnalysis = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'participants',
        populate: {
          path: 'members.user',
          select: 'name dailyFee level'
        }
      })
      .populate('events', 'title actualHours estimatedHours participants');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Collect all unique users from participant groups
    const allUsers = new Map();
    (project.participants as any).forEach((participantGroup: any) => {
      participantGroup.members.forEach((member: any) => {
        const userId = member.user._id.toString();
        if (!allUsers.has(userId)) {
          allUsers.set(userId, {
            name: member.user.name,
            dailyFee: member.user.dailyFee,
            level: member.user.level,
            roles: new Set()
          });
        }
        // Aggregate roles across all participant groups
        member.roles.forEach((role: string) => allUsers.get(userId).roles.add(role));
      });
    });
    
    const costAnalysis = {
      estimatedCost: project.estimatedCost || 0,
      actualCost: project.actualCost || 0,
      budget: project.budget || 0,
      participantCosts: Array.from(allUsers.values()).map(user => ({
        name: user.name,
        dailyFee: user.dailyFee,
        level: user.level,
        roles: Array.from(user.roles)
      }))
    };
    
    res.json(costAnalysis);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};