import { Request, Response } from 'express';
import { Organization, User } from '../models';

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const organization = new Organization(req.body);
    await organization.save();
    
    // No need to update parent - children queried dynamically via parentOrganization
    
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getOrganizations = async (req: Request, res: Response) => {
  try {
    // Don't populate parentOrganization or childOrganizations - we need the ID strings for tree building
    // Sort by parentOrganization to ensure parents come before children
    const organizations = await Organization.find()
      .sort({ parentOrganization: 1 }) // null values first (root orgs)
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
      .populate('members', 'name email role skills level dailyFee');
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Get children dynamically by querying parentOrganization
    const children = await Organization.find({ parentOrganization: req.params.id })
      .select('name description');
    
    res.json({
      ...organization.toObject(),
      children // Add as virtual field for backward compatibility
    });
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
    
    // No need to update parent - child array removed
    
    // Orphan child organizations (set their parent to null)
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
    // Get all organizations and build hierarchy in memory
    const allOrganizations = await Organization.find()
      .populate('members', 'name email role')
      .lean();
    
    // Build tree structure from parent references
    const orgMap = new Map();
    const rootOrgs: any[] = [];
    
    // Initialize all orgs in map with empty children array
    allOrganizations.forEach(org => {
      orgMap.set(org._id.toString(), { ...org, children: [] });
    });
    
    // Build parent-child relationships
    allOrganizations.forEach(org => {
      const node = orgMap.get(org._id.toString());
      if (org.parentOrganization) {
        const parent = orgMap.get(org.parentOrganization.toString());
        if (parent) {
          parent.children.push(node);
        } else {
          rootOrgs.push(node); // Parent not found, treat as root
        }
      } else {
        rootOrgs.push(node);
      }
    });
    
    res.json(rootOrgs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};