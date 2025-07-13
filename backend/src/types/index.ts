export interface IUser {
  name: string;
  email: string;
  password: string;
  role: string;
  skills: string[];
  dailyFee: number;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  mainOrganization: string;
  subOrganizations: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrganization {
  name: string;
  description?: string;
  parentOrganization?: string;
  childOrganizations: string[];
  members: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEvent {
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProject {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  participants: string[];
  events: string[];
  budget?: number;
  estimatedCost?: number;
  actualCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkspace {
  name: string;
  description?: string;
  projects: string[];
  owner: string;
  members: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExternalSourceConfig {
  name: string;
  type: 'jira' | 'github' | 'confluence';
  baseUrl: string;
  credentials: {
    username?: string;
    token: string;
    apiKey?: string;
  };
  isActive: boolean;
  lastSyncAt?: Date;
  syncFrequency: number;
  projectMappings: {
    externalId: string;
    internalProjectId: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}