import React, { useState, useEffect } from 'react';
import { Workspace, Project, User, Organization } from '../types';
import { workspaceApi, userApi, organizationApi, projectApi } from '../services/api';
import ProjectRow from '../components/ProjectRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadWorkspaces}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold tracking-tight">Project Lead Time Visualizer</h1>
            
            <div className="flex items-center space-x-4">
              {workspaces.length > 1 && (
                <Select 
                  value={selectedWorkspace?._id || ''} 
                  onValueChange={(value) => {
                    const workspace = workspaces.find(w => w._id === value);
                    setSelectedWorkspace(workspace || null);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(workspace => (
                      <SelectItem key={workspace._id} value={workspace._id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Dialog open={showCreateOrganizationDialog} onOpenChange={setShowCreateOrganizationDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openOrganizationDialog} className="bg-orange-600 hover:bg-orange-700">
                    Add Organization
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openUserDialog} className="bg-green-600 hover:bg-green-700">
                    Add User
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showCreateWorkspaceDialog} onOpenChange={setShowCreateWorkspaceDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openWorkspaceDialog}>
                    Add Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedWorkspace ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-2">{selectedWorkspace.name}</h2>
              {selectedWorkspace.description && (
                <p className="text-muted-foreground">{selectedWorkspace.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{getTotalProjects()}</div>
                  <div className="text-muted-foreground">Total Projects</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{getActiveProjects()}</div>
                  <div className="text-muted-foreground">Active Projects</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-muted-foreground">{getCompletedProjects()}</div>
                  <div className="text-muted-foreground">Completed Projects</div>
                </CardContent>
              </Card>
            </div>

            {selectedWorkspace.projects && selectedWorkspace.projects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Projects</h3>
                  <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={openProjectDialog} className="bg-purple-600 hover:bg-purple-700">
                        Add Project
                      </Button>
                    </DialogTrigger>
                  </Dialog>
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
                <div className="text-muted-foreground text-lg mb-4">No projects found</div>
                <p className="text-muted-foreground mb-6">This workspace doesn't have any projects yet.</p>
                <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={openProjectDialog} size="lg" className="bg-purple-600 hover:bg-purple-700">
                      Create Your First Project
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">No workspaces found</div>
            <p className="text-muted-foreground mb-6">Create a workspace to get started with project tracking.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Dialog open={showCreateOrganizationDialog} onOpenChange={setShowCreateOrganizationDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openOrganizationDialog} size="lg" className="bg-orange-600 hover:bg-orange-700">
                    Create Your First Organization
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openUserDialog} size="lg" className="bg-green-600 hover:bg-green-700">
                    Create Your First User
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showCreateWorkspaceDialog} onOpenChange={setShowCreateWorkspaceDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openWorkspaceDialog} size="lg">
                    Create Your First Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateWorkspaceDialog} onOpenChange={setShowCreateWorkspaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name *</Label>
              <Input
                id="workspace-name"
                value={workspaceFormData.name}
                onChange={(e) => setWorkspaceFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workspace name"
                required
                disabled={createWorkspaceLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-description">Description</Label>
              <textarea
                id="workspace-description"
                value={workspaceFormData.description}
                onChange={(e) => setWorkspaceFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter workspace description"
                rows={3}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={createWorkspaceLoading}
                aria-label="Workspace description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-owner">Owner *</Label>
              {usersLoading ? (
                <div className="text-sm text-muted-foreground">Loading users...</div>
              ) : (
                <Select 
                  value={workspaceFormData.owner} 
                  onValueChange={(value) => setWorkspaceFormData(prev => ({ ...prev, owner: value }))}
                  required
                  disabled={createWorkspaceLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateWorkspaceDialog(false)}
                disabled={createWorkspaceLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWorkspaceLoading || !workspaceFormData.name.trim() || !workspaceFormData.owner}
              >
                {createWorkspaceLoading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name *</Label>
                <Input
                  id="user-name"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                  required
                  disabled={createUserLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                  disabled={createUserLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">Password *</Label>
              <Input
                id="user-password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
                disabled={createUserLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-role">Role *</Label>
                <Input
                  id="user-role"
                  value={userFormData.role}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Enter role (e.g., Developer, Designer)"
                  required
                  disabled={createUserLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-daily-fee">Daily Fee *</Label>
                <Input
                  id="user-daily-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={userFormData.dailyFee}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, dailyFee: e.target.value }))}
                  placeholder="Enter daily fee"
                  required
                  disabled={createUserLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-level">Level *</Label>
                <Select 
                  value={userFormData.level} 
                  onValueChange={(value: any) => setUserFormData(prev => ({ ...prev, level: value }))}
                  required
                  disabled={createUserLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Principal">Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-organization">Main Organization *</Label>
                {organizationsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading organizations...</div>
                ) : (
                  <Select 
                    value={userFormData.mainOrganization} 
                    onValueChange={(value) => setUserFormData(prev => ({ ...prev, mainOrganization: value }))}
                    required
                    disabled={createUserLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org._id} value={org._id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              {userFormData.skills.map((skill, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    placeholder="Enter skill"
                    disabled={createUserLoading}
                  />
                  {userFormData.skills.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkillField(index)}
                      disabled={createUserLoading}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkillField}
                disabled={createUserLoading}
              >
                + Add Skill
              </Button>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUserDialog(false)}
                disabled={createUserLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={createUserLoading || !userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.role.trim() || !userFormData.dailyFee || !userFormData.level || !userFormData.mainOrganization}
              >
                {createUserLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
                disabled={createProjectLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <textarea
                id="project-description"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description"
                rows={3}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={createProjectLoading}
                aria-label="Project description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-status">Status *</Label>
                <Select 
                  value={projectFormData.status} 
                  onValueChange={(value: any) => setProjectFormData(prev => ({ ...prev, status: value }))}
                  required
                  disabled={createProjectLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-start-date">Start Date *</Label>
                <Input
                  id="project-start-date"
                  type="date"
                  value={projectFormData.startDate}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  disabled={createProjectLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-end-date">End Date</Label>
                <Input
                  id="project-end-date"
                  type="date"
                  value={projectFormData.endDate}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={createProjectLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-budget">Budget</Label>
                <Input
                  id="project-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={projectFormData.budget}
                  onChange={(e) => setProjectFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="Enter budget"
                  disabled={createProjectLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-estimated-cost">Estimated Cost</Label>
              <Input
                id="project-estimated-cost"
                type="number"
                min="0"
                step="0.01"
                value={projectFormData.estimatedCost}
                onChange={(e) => setProjectFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                placeholder="Enter estimated cost"
                disabled={createProjectLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              {usersLoading ? (
                <div className="text-sm text-muted-foreground">Loading users...</div>
              ) : (
                <div className="max-h-32 overflow-y-auto border border-input rounded-md p-3 space-y-2">
                  {users.map(user => (
                    <div key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`participant-${user._id}`}
                        checked={projectFormData.participants.indexOf(user._id) !== -1}
                        onChange={() => handleParticipantToggle(user._id)}
                        className="h-4 w-4 text-primary border-input rounded focus:ring-ring"
                        disabled={createProjectLoading}
                      />
                      <Label htmlFor={`participant-${user._id}`} className="text-sm">
                        {user.name} ({user.email})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateProjectDialog(false)}
                disabled={createProjectLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createProjectLoading || !projectFormData.name.trim() || !projectFormData.startDate}
              >
                {createProjectLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Organization Dialog */}
      <Dialog open={showCreateOrganizationDialog} onOpenChange={setShowCreateOrganizationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organization Name *</Label>
              <Input
                id="organization-name"
                value={organizationFormData.name}
                onChange={(e) => setOrganizationFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter organization name"
                required
                disabled={createOrganizationLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization-description">Description</Label>
              <textarea
                id="organization-description"
                value={organizationFormData.description}
                onChange={(e) => setOrganizationFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter organization description"
                rows={3}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={createOrganizationLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-parent">Parent Organization</Label>
              {organizationsLoading ? (
                <div className="text-sm text-muted-foreground">Loading organizations...</div>
              ) : (
                <Select 
                  value={organizationFormData.parentOrganization} 
                  onValueChange={(value) => setOrganizationFormData(prev => ({ ...prev, parentOrganization: value }))}
                  disabled={createOrganizationLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org._id} value={org._id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateOrganizationDialog(false)}
                disabled={createOrganizationLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={createOrganizationLoading || !organizationFormData.name.trim()}
              >
                {createOrganizationLoading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;