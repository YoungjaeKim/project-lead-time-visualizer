import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Organization } from '../models';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    
    await user.save();
    
    const { password: _, ...userResponse } = user.toObject();
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password')
      .populate('mainOrganization', 'name')
      .populate('subOrganizations', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id, '-password')
      .populate('mainOrganization', 'name description')
      .populate('subOrganizations', 'name description');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUsersByOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    const users = await User.find({
      $or: [
        { mainOrganization: organizationId },
        { subOrganizations: organizationId }
      ]
    }, '-password').populate('mainOrganization subOrganizations', 'name');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUsersBySkill = async (req: Request, res: Response) => {
  try {
    const { skill } = req.params;
    
    const users = await User.find({
      skills: { $in: [skill] }
    }, '-password').populate('mainOrganization', 'name');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};