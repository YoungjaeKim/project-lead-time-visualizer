import React, { useState, useEffect, useCallback } from 'react';
import { Organization as OrgType, User, Project } from '../types';
import { organizationApi, userApi, projectApi } from '../services/api';
import OrganizationTree from '../components/OrganizationTree';
import { 
  CreateOrganizationDialog, 
  CreateUserDialog,
  type OrganizationFormData,
  type UserFormData
} from '../components/dialogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useDialog, useFormLoading } from '@/hooks/useDialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ChevronRight, ChevronDown, Trash2, Edit } from 'lucide-react';

const Organization: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrgType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const organizationDialog = useDialog();
  const userDialog = useDialog();
  
  // Loading states
  const organizationLoading = useFormLoading();
  const userLoading = useFormLoading();
  
  // Data loading states
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadOrganizations(), loadUsers()]);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
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

  const loadUserProjects = useCallback(async (userId: string) => {
    try {
      setProjectsLoading(true);
      const response = await projectApi.getAll();
      // Filter projects where user is a participant
      const filteredProjects = response.data.filter(project => 
        project.participants.some(p => p._id === userId)
      );
      setUserProjects(filteredProjects);
    } catch (err) {
      console.error('Error loading user projects:', err);
      setUserProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserProjects(selectedUser._id);
    } else {
      setUserProjects([]);
    }
  }, [selectedUser, loadUserProjects]);

  const handleCreateOrganization = async (data: OrganizationFormData) => {
    try {
      organizationLoading.startLoading();
      const organizationData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        parentOrganization: data.parentOrganization || undefined
      };
      
      await organizationApi.create(organizationData);
      await loadOrganizations();
      organizationDialog.close();
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization');
      throw err;
    } finally {
      organizationLoading.stopLoading();
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
      
      await userApi.create(userData);
      await loadUsers();
      userDialog.close();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
      throw err;
    } finally {
      userLoading.stopLoading();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userApi.delete(userId);
      await loadUsers();
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    
    try {
      await organizationApi.delete(orgId);
      await loadOrganizations();
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError('Failed to delete organization');
    }
  };

  const openOrganizationDialog = () => {
    organizationDialog.open();
    loadOrganizations();
  };

  const openUserDialog = () => {
    userDialog.open();
    loadOrganizations();
  };

  const getOrganizationName = (orgId: string) => {
    const org = organizations.find(o => o._id === orgId);
    return org?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className={STYLE_CONSTANTS.loading.container}>
        <div className={STYLE_CONSTANTS.loading.card}>
          <div className={STYLE_CONSTANTS.loading.spinner}></div>
          <p className={STYLE_CONSTANTS.loading.text}>Loading organizations...</p>
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
            onClick={loadData}
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
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => window.location.href = '/'} 
                className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.sm}`}
              >
                ← Back
              </Button>
              <h1 className={STYLE_CONSTANTS.typography.pageTitle}>
                Organizations & Users
              </h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Dialog open={organizationDialog.isOpen} onOpenChange={organizationDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openOrganizationDialog} 
                    className={`${STYLE_CONSTANTS.button.secondary} ${STYLE_CONSTANTS.button.sizes.sm}`}
                  >
                    Add Organization
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={userDialog.isOpen} onOpenChange={userDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openUserDialog} 
                    className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
                  >
                    Add User
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className={STYLE_CONSTANTS.layout.contentContainer}>
        {/* Organization Tree */}
        <div className={STYLE_CONSTANTS.spacing.section}>
          <h3 className={`${STYLE_CONSTANTS.typography.sectionTitle} mb-4`}>
            Organization Hierarchy
          </h3>
          {organizationsLoading ? (
            <div className="text-neutral-500 text-sm">Loading organizations...</div>
          ) : (
            <OrganizationTree 
              organizations={organizations}
              users={users}
              onOrganizationClick={(org) => console.log('Clicked org:', org)}
            />
          )}
        </div>

        {/* Users Table */}
        <div className={STYLE_CONSTANTS.spacing.section}>
          <h3 className={`${STYLE_CONSTANTS.typography.sectionTitle} mb-4`}>
            All Users
          </h3>
          
          {usersLoading ? (
            <div className="text-neutral-500 text-sm">Loading users...</div>
          ) : users.length > 0 ? (
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Daily Fee</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <React.Fragment key={user._id}>
                        <TableRow 
                          className={`cursor-pointer hover:bg-neutral-50 ${
                            selectedUser?._id === user._id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedUser(selectedUser?._id === user._id ? null : user)}
                        >
                          <TableCell>
                            {selectedUser?._id === user._id ? (
                              <ChevronDown className="w-4 h-4 text-neutral-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-neutral-500" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.level}
                            </span>
                          </TableCell>
                          <TableCell>{getOrganizationName(user.mainOrganization)}</TableCell>
                          <TableCell>${user.dailyFee}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user._id);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {selectedUser?._id === user._id && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-neutral-50">
                              <div className="py-4 px-6">
                                <h4 className="font-semibold text-sm text-neutral-700 mb-3">
                                  Projects ({userProjects.length})
                                </h4>
                                {projectsLoading ? (
                                  <div className="text-sm text-neutral-500">Loading projects...</div>
                                ) : userProjects.length > 0 ? (
                                  <div className="space-y-2">
                                    {userProjects.map((project) => (
                                      <div 
                                        key={project._id}
                                        className="flex items-center justify-between p-3 bg-white rounded border border-neutral-200 hover:border-neutral-300 cursor-pointer transition-colors"
                                        onClick={() => window.location.href = `/project/${project._id}`}
                                      >
                                        <div className="flex-1">
                                          <div className="font-medium text-sm text-neutral-800">
                                            {project.name}
                                          </div>
                                          {project.description && (
                                            <div className="text-xs text-neutral-500 mt-1">
                                              {project.description}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                          <span className={`
                                            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                            ${project.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                            ${project.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                                            ${project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${project.status === 'on-hold' ? 'bg-orange-100 text-orange-800' : ''}
                                            ${project.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                          `}>
                                            {project.status}
                                          </span>
                                          {project.budget && (
                                            <span className="text-sm text-neutral-600">
                                              Budget: ${project.budget.toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-neutral-500">
                                    No projects found for this user.
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-neutral-500">No users found</p>
                <p className="text-sm text-neutral-400 mt-1">Create your first user to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Components */}
      <CreateOrganizationDialog
        isOpen={organizationDialog.isOpen}
        onOpenChange={organizationDialog.onOpenChange}
        onSubmit={handleCreateOrganization}
        organizations={organizations}
        organizationsLoading={organizationsLoading}
        isLoading={organizationLoading.isLoading}
      />

      <CreateUserDialog
        isOpen={userDialog.isOpen}
        onOpenChange={userDialog.onOpenChange}
        onSubmit={handleCreateUser}
        organizations={organizations}
        organizationsLoading={organizationsLoading}
        isLoading={userLoading.isLoading}
      />
    </div>
  );
};

export default Organization;


