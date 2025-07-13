import axios from 'axios';
import { Workspace, Project, Event, User, Organization, ExternalSourceConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const workspaceApi = {
  getAll: () => api.get<Workspace[]>('/workspaces'),
  getById: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  create: (data: Partial<Workspace>) => api.post<Workspace>('/workspaces', data),
  update: (id: string, data: Partial<Workspace>) => api.put<Workspace>(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
  addProject: (workspaceId: string, projectId: string) => 
    api.post(`/workspaces/${workspaceId}/projects/${projectId}`),
  removeProject: (workspaceId: string, projectId: string) => 
    api.delete(`/workspaces/${workspaceId}/projects/${projectId}`),
};

export const projectApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getCostAnalysis: (id: string) => api.get(`/projects/${id}/cost-analysis`),
  addParticipant: (projectId: string, userId: string) => 
    api.post(`/projects/${projectId}/participants/${userId}`),
  removeParticipant: (projectId: string, userId: string) => 
    api.delete(`/projects/${projectId}/participants/${userId}`),
};

export const eventApi = {
  getAll: (projectId?: string) => api.get<Event[]>('/events', { params: { projectId } }),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/events', data),
  update: (id: string, data: Partial<Event>) => api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  updateStatus: (id: string, status: 'done' | 'ongoing' | 'notyet') => 
    api.patch(`/events/${id}/status`, { status }),
  getByDateRange: (startDate?: string, endDate?: string, projectId?: string) => 
    api.get<Event[]>('/events/date-range', { params: { startDate, endDate, projectId } }),
};

export const userApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getByOrganization: (organizationId: string) => 
    api.get<User[]>(`/users/organization/${organizationId}`),
  getBySkill: (skill: string) => api.get<User[]>(`/users/skill/${skill}`),
};

export const organizationApi = {
  getAll: () => api.get<Organization[]>('/organizations'),
  getById: (id: string) => api.get<Organization>(`/organizations/${id}`),
  create: (data: Partial<Organization>) => api.post<Organization>('/organizations', data),
  update: (id: string, data: Partial<Organization>) => api.put<Organization>(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  getHierarchy: () => api.get<Organization[]>('/organizations/hierarchy'),
  addMember: (organizationId: string, userId: string) => 
    api.post(`/organizations/${organizationId}/members/${userId}`),
  removeMember: (organizationId: string, userId: string) => 
    api.delete(`/organizations/${organizationId}/members/${userId}`),
};

export const externalSourceApi = {
  getAll: () => api.get<ExternalSourceConfig[]>('/external-sources'),
  getById: (id: string) => api.get<ExternalSourceConfig>(`/external-sources/${id}`),
  create: (data: Partial<ExternalSourceConfig>) => api.post<ExternalSourceConfig>('/external-sources', data),
  update: (id: string, data: Partial<ExternalSourceConfig>) => 
    api.put<ExternalSourceConfig>(`/external-sources/${id}`, data),
  delete: (id: string) => api.delete(`/external-sources/${id}`),
  testConnection: (id: string) => api.post(`/external-sources/${id}/test`),
  triggerSync: (id: string) => api.post(`/external-sources/${id}/sync`),
  triggerAllSync: () => api.post('/external-sources/sync-all'),
};

export default api;