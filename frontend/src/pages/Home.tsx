import React, { useState, useEffect, useCallback } from 'react';
import { Workspace, Project, User, Organization } from '../types';
import { workspaceApi, userApi, organizationApi, projectApi } from '../services/api';
import ProjectRow from '../components/ProjectRow';
import { 
  CreateWorkspaceDialog, 
  CreateOrganizationDialog, 
  CreateUserDialog, 
  CreateProjectDialog,
  type WorkspaceFormData,
  type OrganizationFormData,
  type UserFormData,
  type ProjectFormData
} from '../components/dialogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useDialog, useFormLoading } from '@/hooks/useDialog';

const Home: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states using custom hooks
  const workspaceDialog = useDialog();
  const userDialog = useDialog();
  const projectDialog = useDialog();
  const organizationDialog = useDialog();
  
  // Loading states using custom hooks
  const workspaceLoading = useFormLoading();
  const userLoading = useFormLoading();
  const projectLoading = useFormLoading();
  const organizationLoading = useFormLoading();
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  // Removed: participants are now managed per-project via Participant groups

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

  // Removed: loadParticipants - participants are now managed per-project

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

  // Removed: useEffect for loading participants

  const handleCreateWorkspace = async (data: WorkspaceFormData) => {
    try {
      workspaceLoading.startLoading();
      const workspaceData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        owner: data.owner
      };
      
      const response = await workspaceApi.create(workspaceData);
      const newWorkspace = response.data;
      
      setWorkspaces(prev => [...prev, newWorkspace]);
      setSelectedWorkspace(newWorkspace);
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create workspace');
      throw err;
    } finally {
      workspaceLoading.stopLoading();
    }
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      userLoading.startLoading();
      const userData = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role.trim(),
        dailyFee: parseFloat(data.dailyFee),
        level: data.level as 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal',
        mainOrganization: data.mainOrganization,
        skills: data.skills.filter(skill => skill.trim()).map(skill => skill.trim())
      };
      
      const response = await userApi.create(userData);
      console.log('User created:', response.data);
      
      // Refresh users list if workspace dialog is open
      if (workspaceDialog.isOpen) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
      throw err;
    } finally {
      userLoading.stopLoading();
    }
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    if (!selectedWorkspace) return;

    try {
      projectLoading.startLoading();
      const projectData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        // Note: participants removed - managed separately via participant groups
        budget: data.budget ? parseFloat(data.budget) : undefined,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined
      };
      
      // Create the project
      const response = await projectApi.create(projectData as any);
      const newProject = response.data;
      
      // Add project to the workspace
      await workspaceApi.addProject(selectedWorkspace._id, newProject._id);
      
      // Refresh workspace to show the new project
      await refreshSelectedWorkspace();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      throw err;
    } finally {
      projectLoading.stopLoading();
    }
  };

  const handleCreateOrganization = async (data: OrganizationFormData) => {
    try {
      organizationLoading.startLoading();
      const organizationData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        parentOrganization: data.parentOrganization || undefined
      };
      
      const response = await organizationApi.create(organizationData);
      console.log('Organization created:', response.data);
      
      // Refresh organizations list if user dialog is open
      if (userDialog.isOpen) {
        loadOrganizations();
      }
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization');
      throw err;
    } finally {
      organizationLoading.stopLoading();
    }
  };

  const handleProjectClick = (project: Project) => {
    window.location.href = `/project/${project._id}`;
  };

  const openWorkspaceDialog = () => {
    workspaceDialog.open();
    loadUsers();
  };

  const openUserDialog = () => {
    userDialog.open();
    loadOrganizations();
  };

  const openProjectDialog = () => {
    projectDialog.open();
    loadUsers();
  };

  const openOrganizationDialog = () => {
    organizationDialog.open();
    loadOrganizations();
  };



  const getTotalProjects = () => selectedWorkspace?.projects?.length || 0;
  const getActiveProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'active').length || 0;
  const getCompletedProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'completed').length || 0;

  if (loading) {
    return (
      <div className={STYLE_CONSTANTS.loading.container}>
        <div className={STYLE_CONSTANTS.loading.card}>
          <div className={STYLE_CONSTANTS.loading.spinner}></div>
          <p className={STYLE_CONSTANTS.loading.text}>Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={STYLE_CONSTANTS.error.container}>
        <div className={STYLE_CONSTANTS.error.card}>
          <Alert variant="destructive" className={STYLE_CONSTANTS.error.alert}>
            <AlertDescription className={STYLE_CONSTANTS.error.text}>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={loadWorkspaces}
            className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={STYLE_CONSTANTS.layout.pageContainer}>
      {/* Header */}
      <div className={STYLE_CONSTANTS.layout.headerContainer}>
        <div className={STYLE_CONSTANTS.layout.headerContent}>
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:py-0 ${STYLE_CONSTANTS.layout.headerHeight} gap-3`}>
            <h1 className={STYLE_CONSTANTS.typography.pageTitle}>
              Project Lead Time Visualizer
            </h1>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button 
                onClick={() => window.location.href = '/organization'} 
                className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.sm}`}
              >
                Organization
              </Button>
              
              {workspaces.length > 1 && (
                <Select 
                  value={selectedWorkspace?._id || ''} 
                  onValueChange={(value) => {
                    const workspace = workspaces.find(w => w._id === value);
                    setSelectedWorkspace(workspace || null);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48 rounded border-neutral-300 h-8 text-sm">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                    {workspaces.map(workspace => (
                      <SelectItem key={workspace._id} value={workspace._id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Dialog open={workspaceDialog.isOpen} onOpenChange={workspaceDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openWorkspaceDialog}
                    className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
                  >
                    Add Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className={STYLE_CONSTANTS.layout.contentContainer}>
        {selectedWorkspace ? (
          <>
            {/* Workspace Header */}
            <div className="mb-8">
              <h2 className={STYLE_CONSTANTS.typography.pageTitle}>
                {selectedWorkspace.name}
              </h2>
              {selectedWorkspace.description && (
                <p className={STYLE_CONSTANTS.typography.description}>{selectedWorkspace.description}</p>
              )}
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 ${STYLE_CONSTANTS.spacing.gridGap} mb-8`}>
              <Card className={STYLE_CONSTANTS.card.base}>
                <CardContent className={`${STYLE_CONSTANTS.card.content} ${STYLE_CONSTANTS.stats.container}`}>
                  <div className={STYLE_CONSTANTS.stats.value}>{getTotalProjects()}</div>
                  <div className={STYLE_CONSTANTS.stats.label}>Total Projects</div>
                </CardContent>
              </Card>
              
              <Card className={STYLE_CONSTANTS.card.base}>
                <CardContent className={`${STYLE_CONSTANTS.card.content} ${STYLE_CONSTANTS.stats.container}`}>
                  <div className={STYLE_CONSTANTS.stats.value}>{getActiveProjects()}</div>
                  <div className={STYLE_CONSTANTS.stats.label}>Active Projects</div>
                </CardContent>
              </Card>
              
              <Card className={STYLE_CONSTANTS.card.base}>
                <CardContent className={`${STYLE_CONSTANTS.card.content} ${STYLE_CONSTANTS.stats.container}`}>
                  <div className="text-2xl font-semibold text-neutral-600 mb-1">{getCompletedProjects()}</div>
                  <div className={STYLE_CONSTANTS.stats.label}>Completed Projects</div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            {selectedWorkspace.projects && selectedWorkspace.projects.length > 0 ? (
              <div className={STYLE_CONSTANTS.spacing.section}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className={STYLE_CONSTANTS.typography.sectionTitle}>Projects</h3>
                  <Dialog open={projectDialog.isOpen} onOpenChange={projectDialog.onOpenChange}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={openProjectDialog} 
                        className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.md}`}
                      >
                        Add Project
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
                <div className={`grid ${STYLE_CONSTANTS.spacing.gridGapSmall}`}>
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
              <div className="text-center py-16">
                <div className="text-neutral-500 text-lg font-medium mb-2">No projects found</div>
                <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">This workspace doesn't have any projects yet. Create your first project to get started.</p>
                <Dialog open={projectDialog.isOpen} onOpenChange={projectDialog.onOpenChange}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={openProjectDialog} 
                      className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.lg}`}
                    >
                      Create Your First Project
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-neutral-500 text-lg font-medium mb-2">No workspaces found</div>
            <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">Create a workspace to get started with project tracking.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Dialog open={organizationDialog.isOpen} onOpenChange={organizationDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openOrganizationDialog} 
                    className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.lg}`}
                  >
                    Create Your First Organization
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={userDialog.isOpen} onOpenChange={userDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openUserDialog} 
                    className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.lg}`}
                  >
                    Create Your First User
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={workspaceDialog.isOpen} onOpenChange={workspaceDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openWorkspaceDialog} 
                    className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.lg}`}
                  >
                    Create Your First Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Components */}
      <CreateWorkspaceDialog
        isOpen={workspaceDialog.isOpen}
        onOpenChange={workspaceDialog.onOpenChange}
        onSubmit={handleCreateWorkspace}
        users={users}
        usersLoading={usersLoading}
        isLoading={workspaceLoading.isLoading}
      />

      <CreateUserDialog
        isOpen={userDialog.isOpen}
        onOpenChange={userDialog.onOpenChange}
        onSubmit={handleCreateUser}
        organizations={organizations}
        organizationsLoading={organizationsLoading}
        isLoading={userLoading.isLoading}
      />

      <CreateProjectDialog
        isOpen={projectDialog.isOpen}
        onOpenChange={projectDialog.onOpenChange}
        onSubmit={handleCreateProject}
        users={users}
        usersLoading={usersLoading}
        isLoading={projectLoading.isLoading}
      />

      <CreateOrganizationDialog
        isOpen={organizationDialog.isOpen}
        onOpenChange={organizationDialog.onOpenChange}
        onSubmit={handleCreateOrganization}
        organizations={organizations}
        organizationsLoading={organizationsLoading}
        isLoading={organizationLoading.isLoading}
      />
    </div>
  );
};

export default Home;