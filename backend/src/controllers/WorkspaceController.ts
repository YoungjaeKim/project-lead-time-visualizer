import { Request, Response } from 'express';
import { Workspace, Project, type IUserDocument } from '../models';

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = new Workspace(req.body);
    await workspace.save();
    res.status(201).json(workspace);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await Workspace.find()
      .populate('owner', 'name email')
      .populate({
        path: 'projects',
        populate: {
          path: 'participants events',
          select: 'name email role dailyFee level title status startDate endDate type'
        }
      });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate({
        path: 'projects',
        populate: {
          path: 'participants events',
          select: 'name email title status startDate endDate'
        }
      });
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getWorkspaceParticipants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).select('projects');

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.projects || workspace.projects.length === 0) {
      return res.json([]);
    }

    const projects = await Project.find({ _id: { $in: workspace.projects } })
      .select('participants')
      .populate<{ participants: IUserDocument[] }>(
        'participants',
        'name email role dailyFee level'
      );

    const participantsMap = new Map<string, IUserDocument>();

    projects.forEach((project) => {
      project.participants?.forEach((participant) => {
        if (!participant) {
          return;
        }

        const participantId = participant._id?.toString();

        if (participantId && !participantsMap.has(participantId)) {
          participantsMap.set(participantId, participant);
        }
      });
    });

    const participantsList = Array.from(participantsMap.values()).map((participant) => ({
      _id: participant._id?.toString() ?? '',
      name: participant.name,
      email: participant.email,
      role: participant.role,
      dailyFee: participant.dailyFee,
      level: participant.level
    }));

    res.json(participantsList);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const addProjectToWorkspace = async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectId } = req.params;
    
    const workspace = await Workspace.findById(workspaceId);
    const project = await Project.findById(projectId);
    
    if (!workspace || !project) {
      return res.status(404).json({ error: 'Workspace or Project not found' });
    }
    
    if (!workspace.projects.includes(projectId as any)) {
      workspace.projects.push(projectId as any);
      await workspace.save();
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const removeProjectFromWorkspace = async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectId } = req.params;
    
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    workspace.projects = workspace.projects.filter(
      (id) => id.toString() !== projectId
    );
    await workspace.save();
    
    res.json(workspace);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};