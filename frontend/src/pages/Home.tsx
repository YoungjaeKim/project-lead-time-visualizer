import React, { useState, useEffect } from 'react';
import { Workspace, Project, User, Organization } from '../types';
import { workspaceApi, userApi, organizationApi, projectApi } from '../services/api';
import ProjectRow from '../components/ProjectRow';

const Home: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Workspace dialog state
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = useState(false);
  const [createWorkspaceLoading, setCreateWorkspaceLoading] = useState(false);
  const [workspaceFormData, setWorkspaceFormData] = useState({
    name: '',
    description: '',
    owner: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // User dialog state
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    dailyFee: '',
    level: '' as 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | '',
    mainOrganization: '',
    skills: ['']
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  // Project dialog state
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
    startDate: '',
    endDate: '',
    participants: [] as string[],
    budget: '',
    estimatedCost: ''
  });

  // Organization dialog state
  const [showCreateOrganizationDialog, setShowCreateOrganizationDialog] = useState(false);
  const [createOrganizationLoading, setCreateOrganizationLoading] = useState(false);
  const [organizationFormData, setOrganizationFormData] = useState({
    name: '',
    description: '',
    parentOrganization: ''
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspaceApi.getAll();
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setSelectedWorkspace(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load workspaces');
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      const response = await organizationApi.getAll();
      setOrganizations(response.data);
    } catch (err) {
      console.error('Error loading organizations:', err);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const refreshSelectedWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    try {
      const response = await workspaceApi.getById(selectedWorkspace._id);
      const updatedWorkspace = response.data;
      setSelectedWorkspace(updatedWorkspace);
      setWorkspaces(prev => prev.map(w => w._id === updatedWorkspace._id ? updatedWorkspace : w));
    } catch (err) {
      console.error('Error refreshing workspace:', err);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceFormData.name.trim() || !workspaceFormData.owner) return;

    try {
      setCreateWorkspaceLoading(true);
      const workspaceData = {
        name: workspaceFormData.name.trim(),
        description: workspaceFormData.description.trim() || undefined,
        owner: workspaceFormData.owner
      };
      
      const response = await workspaceApi.create(workspaceData);
      const newWorkspace = response.data;
      
      setWorkspaces(prev => [...prev, newWorkspace]);
      setSelectedWorkspace(newWorkspace);
      setShowCreateWorkspaceDialog(false);
      setWorkspaceFormData({ name: '', description: '', owner: '' });
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create workspace');
    } finally {
      setCreateWorkspaceLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim() || 
        !userFormData.role.trim() || !userFormData.dailyFee || !userFormData.level || !userFormData.mainOrganization) {
      return;
    }

    try {
      setCreateUserLoading(true);
      const userData = {
        name: userFormData.name.trim(),
        email: userFormData.email.trim(),
        password: userFormData.password,
        role: userFormData.role.trim(),
        dailyFee: parseFloat(userFormData.dailyFee),
        level: userFormData.level,
        mainOrganization: userFormData.mainOrganization,
        skills: userFormData.skills.filter(skill => skill.trim()).map(skill => skill.trim())
      };
      
      const response = await userApi.create(userData);
      console.log('User created:', response.data);
      
      setShowCreateUserDialog(false);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        dailyFee: '',
        level: '' as any,
        mainOrganization: '',
        skills: ['']
      });
      
      // Refresh users list if workspace dialog is open
      if (showCreateWorkspaceDialog) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim() || !projectFormData.startDate || !selectedWorkspace) return;

    try {
      setCreateProjectLoading(true);
      const projectData = {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim() || undefined,
        status: projectFormData.status,
        startDate: new Date(projectFormData.startDate),
        endDate: projectFormData.endDate ? new Date(projectFormData.endDate) : undefined,
        participants: projectFormData.participants,
        budget: projectFormData.budget ? parseFloat(projectFormData.budget) : undefined,
        estimatedCost: projectFormData.estimatedCost ? parseFloat(projectFormData.estimatedCost) : undefined
      };
      
      // Create the project
      const response = await projectApi.create(projectData as any);
      const newProject = response.data;
      
      // Add project to the workspace
      await workspaceApi.addProject(selectedWorkspace._id, newProject._id);
      
      // Refresh workspace to show the new project
      await refreshSelectedWorkspace();
      
      setShowCreateProjectDialog(false);
      setProjectFormData({
        name: '',
        description: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        participants: [],
        budget: '',
        estimatedCost: ''
      });
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationFormData.name.trim()) return;

    try {
      setCreateOrganizationLoading(true);
      const organizationData = {
        name: organizationFormData.name.trim(),
        description: organizationFormData.description.trim() || undefined,
        parentOrganization: organizationFormData.parentOrganization || undefined
      };
      
      const response = await organizationApi.create(organizationData);
      console.log('Organization created:', response.data);
      
      setShowCreateOrganizationDialog(false);
      setOrganizationFormData({
        name: '',
        description: '',
        parentOrganization: ''
      });
      
      // Refresh organizations list if user dialog is open
      if (showCreateUserDialog) {
        loadOrganizations();
      }
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization');
    } finally {
      setCreateOrganizationLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    window.location.href = `/project/${project._id}`;
  };

  const openWorkspaceDialog = () => {
    setShowCreateWorkspaceDialog(true);
    loadUsers();
  };

  const openUserDialog = () => {
    setShowCreateUserDialog(true);
    loadOrganizations();
  };

  const openProjectDialog = () => {
    setShowCreateProjectDialog(true);
    loadUsers();
  };

  const openOrganizationDialog = () => {
    setShowCreateOrganizationDialog(true);
    loadOrganizations();
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...userFormData.skills];
    newSkills[index] = value;
    setUserFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const addSkillField = () => {
    setUserFormData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkillField = (index: number) => {
    if (userFormData.skills.length > 1) {
      const newSkills = userFormData.skills.filter((_, i) => i !== index);
      setUserFormData(prev => ({ ...prev, skills: newSkills }));
    }
  };

  const handleParticipantToggle = (userId: string) => {
    setProjectFormData(prev => ({
      ...prev,
      participants: prev.participants.indexOf(userId) !== -1
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }));
  };

  const getTotalProjects = () => selectedWorkspace?.projects?.length || 0;
  const getActiveProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'active').length || 0;
  const getCompletedProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'completed').length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadWorkspaces}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Project Lead Time Visualizer</h1>
            
            <div className="flex items-center space-x-4">
              {workspaces.length > 1 && (
                <select
                  value={selectedWorkspace?._id || ''}
                  onChange={(e) => {
                    const workspace = workspaces.find(w => w._id === e.target.value);
                    setSelectedWorkspace(workspace || null);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select workspace"
                >
                  {workspaces.map(workspace => (
                    <option key={workspace._id} value={workspace._id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={openOrganizationDialog}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              >
                Add Organization
              </button>
              
              <button
                onClick={openUserDialog}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Add User
              </button>
              
              <button
                onClick={openWorkspaceDialog}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Add Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedWorkspace ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedWorkspace.name}</h2>
              {selectedWorkspace.description && (
                <p className="text-gray-600">{selectedWorkspace.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{getTotalProjects()}</div>
                <div className="text-gray-600">Total Projects</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{getActiveProjects()}</div>
                <div className="text-gray-600">Active Projects</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-600">{getCompletedProjects()}</div>
                <div className="text-gray-600">Completed Projects</div>
              </div>
            </div>

            {selectedWorkspace.projects && selectedWorkspace.projects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Projects</h3>
                  <button
                    onClick={openProjectDialog}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  >
                    Add Project
                  </button>
                </div>
                <div className="grid gap-4">
                  {selectedWorkspace.projects.map(project => (
                    <ProjectRow
                      key={project._id}
                      project={project}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No projects found</div>
                <p className="text-gray-600 mb-6">This workspace doesn't have any projects yet.</p>
                <button
                  onClick={openProjectDialog}
                  className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  Create Your First Project
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No workspaces found</div>
            <p className="text-gray-600">Create a workspace to get started with project tracking.</p>
            <div className="mt-4 space-x-4">
              <button
                onClick={openOrganizationDialog}
                className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              >
                Create Your First Organization
              </button>
              <button
                onClick={openUserDialog}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Create Your First User
              </button>
              <button
                onClick={openWorkspaceDialog}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Create Your First Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Dialog */}
      {showCreateWorkspaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Workspace</h3>
              <button
                onClick={() => setShowCreateWorkspaceDialog(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name *
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceFormData.name}
                  onChange={(e) => setWorkspaceFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workspace name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={createWorkspaceLoading}
                />
              </div>
              
              <div>
                <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="workspace-description"
                  value={workspaceFormData.description}
                  onChange={(e) => setWorkspaceFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter workspace description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={createWorkspaceLoading}
                />
              </div>

              <div>
                <label htmlFor="workspace-owner" className="block text-sm font-medium text-gray-700 mb-1">
                  Owner *
                </label>
                {usersLoading ? (
                  <div className="text-sm text-gray-500">Loading users...</div>
                ) : (
                  <select
                    id="workspace-owner"
                    value={workspaceFormData.owner}
                    onChange={(e) => setWorkspaceFormData(prev => ({ ...prev, owner: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createWorkspaceLoading}
                  >
                    <option value="">Select an owner</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspaceDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50"
                  disabled={createWorkspaceLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  disabled={createWorkspaceLoading || !workspaceFormData.name.trim() || !workspaceFormData.owner}
                >
                  {createWorkspaceLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      {showCreateUserDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateUserDialog(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createUserLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createUserLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={createUserLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <input
                    id="user-role"
                    type="text"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Enter role (e.g., Developer, Designer)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createUserLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="user-daily-fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Fee *
                  </label>
                  <input
                    id="user-daily-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={userFormData.dailyFee}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, dailyFee: e.target.value }))}
                    placeholder="Enter daily fee"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createUserLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-level" className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <select
                    id="user-level"
                    value={userFormData.level}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, level: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createUserLoading}
                  >
                    <option value="">Select level</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="user-organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Main Organization *
                  </label>
                  {organizationsLoading ? (
                    <div className="text-sm text-gray-500">Loading organizations...</div>
                  ) : (
                    <select
                      id="user-organization"
                      value={userFormData.mainOrganization}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, mainOrganization: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={createUserLoading}
                    >
                      <option value="">Select organization</option>
                      {organizations.map(org => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (Optional)
                </label>
                {userFormData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      placeholder="Enter skill"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={createUserLoading}
                    />
                    {userFormData.skills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkillField(index)}
                        className="text-red-600 hover:text-red-800 focus:outline-none"
                        disabled={createUserLoading}
                        aria-label="Remove skill"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkillField}
                  className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none"
                  disabled={createUserLoading}
                >
                  + Add Skill
                </button>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50"
                  disabled={createUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                  disabled={createUserLoading || !userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.role.trim() || !userFormData.dailyFee || !userFormData.level || !userFormData.mainOrganization}
                >
                  {createUserLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      {showCreateProjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
              <button
                onClick={() => setShowCreateProjectDialog(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={createProjectLoading}
                />
              </div>
              
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="project-description"
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={createProjectLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="project-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    id="project-status"
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={createProjectLoading}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="project-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    id="project-start-date"
                    type="date"
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={createProjectLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="project-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    id="project-end-date"
                    type="date"
                    value={projectFormData.endDate}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={createProjectLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="project-budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (Optional)
                  </label>
                  <input
                    id="project-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={projectFormData.budget}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="Enter budget"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={createProjectLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-estimated-cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost (Optional)
                </label>
                <input
                  id="project-estimated-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={projectFormData.estimatedCost}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  placeholder="Enter estimated cost"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={createProjectLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants (Optional)
                </label>
                {usersLoading ? (
                  <div className="text-sm text-gray-500">Loading users...</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {users.map(user => (
                      <div key={user._id} className="flex items-center space-x-2 mb-1">
                        <input
                          type="checkbox"
                          id={`participant-${user._id}`}
                          checked={projectFormData.participants.indexOf(user._id) !== -1}
                          onChange={() => handleParticipantToggle(user._id)}
                          className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          disabled={createProjectLoading}
                        />
                        <label htmlFor={`participant-${user._id}`} className="text-sm text-gray-700">
                          {user.name} ({user.email})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50"
                  disabled={createProjectLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                  disabled={createProjectLoading || !projectFormData.name.trim() || !projectFormData.startDate}
                >
                  {createProjectLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Dialog */}
      {showCreateOrganizationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Organization</h3>
              <button
                onClick={() => setShowCreateOrganizationDialog(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  id="organization-name"
                  type="text"
                  value={organizationFormData.name}
                  onChange={(e) => setOrganizationFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter organization name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  disabled={createOrganizationLoading}
                />
              </div>
              
              <div>
                <label htmlFor="organization-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="organization-description"
                  value={organizationFormData.description}
                  onChange={(e) => setOrganizationFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter organization description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={createOrganizationLoading}
                />
              </div>

              <div>
                <label htmlFor="organization-parent" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Organization (Optional)
                </label>
                {organizationsLoading ? (
                  <div className="text-sm text-gray-500">Loading organizations...</div>
                ) : (
                  <select
                    id="organization-parent"
                    value={organizationFormData.parentOrganization}
                    onChange={(e) => setOrganizationFormData(prev => ({ ...prev, parentOrganization: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={createOrganizationLoading}
                  >
                    <option value="">Select parent organization</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateOrganizationDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50"
                  disabled={createOrganizationLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                  disabled={createOrganizationLoading || !organizationFormData.name.trim()}
                >
                  {createOrganizationLoading ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;