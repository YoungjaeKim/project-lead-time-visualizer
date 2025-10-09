export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  dailyFee: number;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  mainOrganization: string;
  subOrganizations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceParticipant {
  _id: string;
  name: string;
  email: string;
  role: string;
  dailyFee: number;
  level: User['level'];
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  parentOrganization?: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  type: 'duration' | 'one-time';
  startDate: Date;
  endDate?: Date;
  status: 'done' | 'ongoing' | 'notyet';
  referenceLinks: {
    type: 'jira' | 'github' | 'confluence' | 'other';
    url: string;
    title?: string;
  }[];
  projectId: string;
  participants: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantMember {
  user: User;
  roles: string[]; // Multiple project-specific roles (PM, Dev, Frontend Dev, QA, etc.)
}

export interface Participant {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  parentParticipant?: string | Participant;
  members: ParticipantMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  participants: Participant[]; // Changed from User[] to Participant[]
  events: Event[];
  budget?: number;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  projects: Project[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalSourceConfig {
  _id: string;
  name: string;
  type: 'jira' | 'github' | 'confluence';
  baseUrl: string;
  isActive: boolean;
  lastSyncAt?: Date;
  syncFrequency: number;
  projectMappings: {
    externalId: string;
    internalProjectId: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}