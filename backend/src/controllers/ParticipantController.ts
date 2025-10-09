import { Request, Response } from 'express';
import { Participant, Project, User } from '../models';

// Create a new participant group for a project
export const createParticipant = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const participantData = { ...req.body, projectId };
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const participant = new Participant(participantData);
    await participant.save();

    // Add to project's participants array
    project.participants.push(participant._id as any);
    await project.save();

    // No need to update parent - children queried dynamically via parentParticipant

    res.status(201).json(participant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Get all participant groups for a project
export const getProjectParticipants = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const participants = await Participant.find({ projectId })
      .populate('members.user', 'name email dailyFee level skills')
      .populate('parentParticipant', 'name');
    
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get a specific participant group by ID
export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .populate('members.user', 'name email role skills dailyFee level')
      .populate('parentParticipant', 'name');
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant group not found' });
    }
    
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Update a participant group
export const updateParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const oldParticipant = await Participant.findById(id);
    
    if (!oldParticipant) {
      return res.status(404).json({ error: 'Participant group not found' });
    }

    const participant = await Participant.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('members.user', 'name email role skills dailyFee level');

    // No need to update parent - children queried dynamically
    
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Delete a participant group
export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findById(id);
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant group not found' });
    }

    // Remove from project's participants array
    await Project.findByIdAndUpdate(
      participant.projectId,
      { $pull: { participants: id } }
    );

    // No need to update parent - child array removed

    // Reassign child participants to this participant's parent
    await Participant.updateMany(
      { parentParticipant: id },
      { parentParticipant: participant.parentParticipant }
    );

    await Participant.findByIdAndDelete(id);
    
    res.json({ message: 'Participant group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Add a member to a participant group
export const addMemberToParticipant = async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const { userId, roles } = req.body;
    
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Roles must be a non-empty array' });
    }

    const participant = await Participant.findById(participantId);
    const user = await User.findById(userId);
    
    if (!participant || !user) {
      return res.status(404).json({ error: 'Participant group or User not found' });
    }
    
    // Check if user already exists in members
    const existingMember = participant.members.find(
      m => m.user.toString() === userId
    );
    
    if (existingMember) {
      return res.status(400).json({ error: 'User already exists in this participant group' });
    }
    
    participant.members.push({ user: userId as any, roles });
    await participant.save();
    
    await participant.populate('members.user', 'name email role skills dailyFee level');
    
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Update member roles in a participant group
export const updateMemberRoles = async (req: Request, res: Response) => {
  try {
    const { participantId, userId } = req.params;
    const { roles } = req.body;
    
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Roles must be a non-empty array' });
    }

    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant group not found' });
    }
    
    const member = participant.members.find(
      m => m.user.toString() === userId
    );
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found in this participant group' });
    }
    
    member.roles = roles;
    await participant.save();
    
    await participant.populate('members.user', 'name email role skills dailyFee level');
    
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Remove a member from a participant group
export const removeMemberFromParticipant = async (req: Request, res: Response) => {
  try {
    const { participantId, userId } = req.params;
    
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant group not found' });
    }
    
    participant.members = participant.members.filter(
      m => m.user.toString() !== userId
    );
    
    await participant.save();
    
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

