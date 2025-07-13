import { Request, Response } from 'express';
import { Workspace, Project } from '../models';

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
      .populate('members', 'name email')
      .populate('projects', 'name status startDate endDate');
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
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