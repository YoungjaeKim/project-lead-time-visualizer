import { Request, Response } from 'express';
import { Organization, User } from '../models';

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const organization = new Organization(req.body);
    await organization.save();
    
    if (organization.parentOrganization) {
      await Organization.findByIdAndUpdate(
        organization.parentOrganization,
        { $push: { childOrganizations: organization._id } }
      );
    }
    
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const organizations = await Organization.find()
      .populate('parentOrganization', 'name')
      .populate('childOrganizations', 'name')
      .populate('members', 'name email role');
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('parentOrganization', 'name description')
      .populate('childOrganizations', 'name description')
      .populate('members', 'name email role skills level dailyFee');
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const organization = await Organization.findByIdAndDelete(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    if (organization.parentOrganization) {
      await Organization.findByIdAndUpdate(
        organization.parentOrganization,
        { $pull: { childOrganizations: organization._id } }
      );
    }
    
    await Organization.updateMany(
      { parentOrganization: organization._id },
      { $unset: { parentOrganization: 1 } }
    );
    
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { organizationId, userId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    const user = await User.findById(userId);
    
    if (!organization || !user) {
      return res.status(404).json({ error: 'Organization or User not found' });
    }
    
    if (!organization.members.includes(userId as any)) {
      organization.members.push(userId as any);
      await organization.save();
    }
    
    res.json(organization);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { organizationId, userId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    organization.members = organization.members.filter(
      (id) => id.toString() !== userId
    );
    await organization.save();
    
    res.json(organization);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getOrganizationHierarchy = async (req: Request, res: Response) => {
  try {
    const rootOrganizations = await Organization.find({ parentOrganization: null })
      .populate({
        path: 'childOrganizations',
        populate: {
          path: 'childOrganizations members',
          select: 'name email role'
        }
      })
      .populate('members', 'name email role');
    
    res.json(rootOrganizations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};