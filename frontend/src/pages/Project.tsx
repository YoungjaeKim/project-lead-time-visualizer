import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project as ProjectType, Event, User, ExternalSourceConfig, Participant } from '../types';
import { projectApi, eventApi, userApi, externalSourceApi, participantApi } from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '@/utils/costUtils';
import EventCard from '../components/EventCard';
import ActivityGrid from '../components/ActivityGrid';
import { 
  EditProjectDialog, 
  type EditProjectFormData,
  AddEventDialog,
  type EventFormData as DialogEventFormData,
  AddExternalSourceDialog,
  type ExternalSourceFormData as DialogExternalSourceFormData,
  EditExternalSourceDialog,
  type EditExternalSourceFormData,
  AddParticipantGroupDialog,
  type ParticipantGroupFormData,
  AddMemberDialog,
  type MemberFormData
} from '../components/dialogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useDialog, useFormLoading } from '@/hooks/useDialog';
import { ExternalSourceCard } from '@/components/ExternalSourceCard';
import { Users, Trash2 } from 'lucide-react';

const Project: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProjectType | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [externalSources, setExternalSources] = useState<ExternalSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'done' | 'ongoing' | 'notyet'>('all');

  // Dialog states
  const editProjectDialog = useDialog();
  const editProjectLoading = useFormLoading();

  // Dialog states using custom hooks
  const addEventDialog = useDialog();
  const addExternalSourceDialog = useDialog();
  const editExternalSourceDialog = useDialog();
  const addParticipantGroupDialog = useDialog();
  const addMemberDialog = useDialog();
  
  // Loading states using custom hooks
  const addEventLoading = useFormLoading();
  const addExternalSourceLoading = useFormLoading();
  const editExternalSourceLoading = useFormLoading();
  const addParticipantGroupLoading = useFormLoading();
  const addMemberLoading = useFormLoading();
  
  // External source editing state
  const [editingExternalSource, setEditingExternalSource] = useState<ExternalSourceConfig | null>(null);
  
  // Participant management state
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<Participant | null>(null);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectResponse, eventsResponse, usersResponse] = await Promise.all([
        projectApi.getById(id),
        eventApi.getAll(id),
        userApi.getAll()
      ]);
      
      setProject(projectResponse.data);
      setEvents(eventsResponse.data);
      
      // Store all users for member selection
      setAllUsers(usersResponse.data);
      
      // Load external sources for this project
      await loadExternalSources(projectResponse.data._id);
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract all users from participant groups
  const extractUsersFromParticipants = (project: ProjectType): User[] => {
    if (!project.participants || project.participants.length === 0) return [];
    
    const userMap = new Map<string, User>();
    
    project.participants.forEach(participantGroup => {
      participantGroup.members.forEach(member => {
        if (!userMap.has(member.user._id)) {
          userMap.set(member.user._id, member.user);
        }
      });
    });
    
    return Array.from(userMap.values());
  };

  const openEditProjectDialog = () => {
    editProjectDialog.open();
  };

  const handleUpdateProject = async (data: EditProjectFormData) => {
    if (!project) return;

    try {
      editProjectLoading.startLoading();
      const updateData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget !== '' ? parseFloat(data.budget) : undefined,
        estimatedCost: data.estimatedCost !== '' ? parseFloat(data.estimatedCost) : undefined,
      } as any;

      const response = await projectApi.update(project._id, updateData);
      setProject(response.data);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
      throw err;
    } finally {
      editProjectLoading.stopLoading();
    }
  };

  const loadExternalSources = async (projectId: string) => {
    try {
      const response = await externalSourceApi.getAll();
      // Filter external sources that have this project in their mappings
      const projectExternalSources = response.data.filter(source => 
        source.projectMappings.some(mapping => mapping.internalProjectId === projectId)
      );
      setExternalSources(projectExternalSources);
    } catch (err) {
      console.error('Error loading external sources:', err);
    }
  };

  const handleCreateExternalSource = async (data: DialogExternalSourceFormData) => {
    if (!project) return;

    try {
      addExternalSourceLoading.startLoading();
      const externalSourceData = {
        name: data.name.trim(),
        type: data.type,
        baseUrl: data.baseUrl.trim(),
        credentials: {
          username: data.credentials.username.trim() || undefined,
          token: data.credentials.token.trim(),
          apiKey: data.credentials.apiKey.trim() || undefined
        },
        syncFrequency: data.syncFrequency,
        isActive: data.isActive,
        projectMappings: [{
          externalId: data.externalId.trim(),
          internalProjectId: project._id
        }]
      };
      
      const response = await externalSourceApi.create(externalSourceData as any);
      const newExternalSource = response.data;
      
      setExternalSources([...externalSources, newExternalSource]);
    } catch (err) {
      console.error('Error creating external source:', err);
      setError('Failed to create external source');
      throw err;
    } finally {
      addExternalSourceLoading.stopLoading();
    }
  };

  const handleEditExternalSource = async (data: EditExternalSourceFormData) => {
    if (!editingExternalSource || !project) return;

    try {
      editExternalSourceLoading.startLoading();
      
      // Find existing mapping for this project or create new one
      const existingMappings = editingExternalSource.projectMappings.filter(
        mapping => mapping.internalProjectId !== project._id
      );
      const updatedMappings = [
        ...existingMappings,
        {
          externalId: data.externalId.trim(),
          internalProjectId: project._id
        }
      ];
      
      const updateData = {
        name: data.name.trim(),
        type: data.type,
        baseUrl: data.baseUrl.trim(),
        credentials: {
          username: data.credentials.username.trim() || undefined,
          token: data.credentials.token.trim(),
          apiKey: data.credentials.apiKey.trim() || undefined
        },
        syncFrequency: data.syncFrequency,
        isActive: data.isActive,
        projectMappings: updatedMappings
      };
      
      await externalSourceApi.update(editingExternalSource._id, updateData);
      await loadExternalSources(project._id);
      setEditingExternalSource(null);
    } catch (err) {
      console.error('Error updating external source:', err);
      setError('Failed to update external source');
      throw err;
    } finally {
      editExternalSourceLoading.stopLoading();
    }
  };

  const handleDeleteExternalSource = async (externalSourceId: string) => {
    if (!project) return;
    
    try {
      const source = externalSources.find(s => s._id === externalSourceId);
      if (!source) return;
      
      // If this source only has mapping for current project, delete it entirely
      if (source.projectMappings.length === 1 && 
          source.projectMappings[0].internalProjectId === project._id) {
        await externalSourceApi.delete(externalSourceId);
      } else {
        // Remove only the mapping for this project
        const updatedMappings = source.projectMappings.filter(
          mapping => mapping.internalProjectId !== project._id
        );
        await externalSourceApi.update(externalSourceId, { projectMappings: updatedMappings });
      }
      
      await loadExternalSources(project._id);
    } catch (err) {
      console.error('Error deleting external source:', err);
      setError('Failed to delete external source');
    }
  };

  const handleTestConnection = async (externalSourceId: string) => {
    try {
      await externalSourceApi.testConnection(externalSourceId);
      // You might want to show a success message here
      console.log('Connection test successful');
    } catch (err) {
      console.error('Connection test failed:', err);
      setError('Connection test failed');
    }
  };

  const handleTriggerSync = async (externalSourceId: string) => {
    if (!project) return;
    
    try {
      await externalSourceApi.triggerSync(externalSourceId);
      await loadExternalSources(project._id);
      console.log('Sync triggered successfully');
    } catch (err) {
      console.error('Sync trigger failed:', err);
      setError('Failed to trigger sync');
    }
  };

  const openEditExternalSourceDialog = (externalSource: ExternalSourceConfig) => {
    setEditingExternalSource(externalSource);
    editExternalSourceDialog.open();
  };



  const handleEventStatusChange = async (eventId: string, status: 'done' | 'ongoing' | 'notyet') => {
    try {
      await eventApi.updateStatus(eventId, status);
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, status } : event
      ));
    } catch (err) {
      console.error('Error updating event status:', err);
    }
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    setEvents(prev => prev.map(e => (e._id === updatedEvent._id ? updatedEvent : e)));
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents(prev => prev.filter(e => e._id !== eventId));
  };

  const handleCreateEvent = async (data: DialogEventFormData) => {
    if (!project) return;

    try {
      addEventLoading.startLoading();
      const eventData = {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        type: data.type,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        actualHours: data.actualHours ? parseFloat(data.actualHours) : undefined,
        participants: data.participants,
        referenceLinks: data.referenceLinks.filter(link => link.title.trim() && link.url.trim()),
        projectId: project._id
      };
      
      const response = await eventApi.create(eventData as any);
      const newEvent = response.data;
      
      setEvents([...events, newEvent]);
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
      throw err;
    } finally {
      addEventLoading.stopLoading();
    }
  };

  const handleCreateParticipantGroup = async (data: ParticipantGroupFormData) => {
    if (!project) return;

    try {
      addParticipantGroupLoading.startLoading();
      const groupData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        parentParticipant: data.parentParticipant || undefined,
        members: []
      };
      
      await participantApi.create(project._id, groupData);
      
      // Reload project to get updated participants
      await loadProjectData();
    } catch (err) {
      console.error('Error creating participant group:', err);
      setError('Failed to create participant group');
      throw err;
    } finally {
      addParticipantGroupLoading.stopLoading();
    }
  };

  const openAddMemberDialog = (group: Participant) => {
    setSelectedGroupForMember(group);
    addMemberDialog.open();
  };

  const handleAddMember = async (data: MemberFormData) => {
    if (!selectedGroupForMember) return;

    try {
      addMemberLoading.startLoading();
      await participantApi.addMember(selectedGroupForMember._id, data.userId, data.roles);
      
      // Reload project to get updated participants
      await loadProjectData();
      setSelectedGroupForMember(null);
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member');
      throw err;
    } finally {
      addMemberLoading.stopLoading();
    }
  };

  const handleRemoveMember = async (participantId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await participantApi.removeMember(participantId, userId);
      
      // Reload project to get updated participants
      await loadProjectData();
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
    }
  };

  const handleDeleteParticipantGroup = async (participantId: string) => {
    if (!window.confirm('Are you sure you want to delete this participant group? This will also remove all its members.')) return;

    try {
      await participantApi.delete(participantId);
      
      // Reload project to get updated participants
      await loadProjectData();
    } catch (err) {
      console.error('Error deleting participant group:', err);
      setError('Failed to delete participant group');
    }
  };



  const getFilteredEvents = () => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.status === eventFilter);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'planning': return 'secondary';
      case 'on-hold': return 'outline';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className={STYLE_CONSTANTS.loading.container}>
        <div className={STYLE_CONSTANTS.loading.card}>
          <div className={STYLE_CONSTANTS.loading.spinner}></div>
          <p className={STYLE_CONSTANTS.loading.text}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={STYLE_CONSTANTS.error.container}>
        <div className={STYLE_CONSTANTS.error.card}>
          <Alert variant="destructive" className={STYLE_CONSTANTS.error.alert}>
            <AlertDescription className={STYLE_CONSTANTS.error.text}>
              {error || 'Project not found'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/')}
            className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const actualCost = calculateProjectCost(project);
  const budgetUsage = project.budget ? calculateBudgetUsage(actualCost, project.budget) : 0;
  const budgetStatus = getBudgetStatus(budgetUsage);

  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : new Date();

  const adjustedStartDate = new Date();
  adjustedStartDate.setDate(adjustedStartDate.getDate() - 48);

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'danger': return 'text-red-600';
      default: return 'text-neutral-600';
    }
  };

  return (
    <div className={STYLE_CONSTANTS.layout.pageContainer}>
      {/* Header */}
      <div className={STYLE_CONSTANTS.layout.headerContainer}>
        <div className={STYLE_CONSTANTS.layout.headerContent}>
          <div className={`${STYLE_CONSTANTS.layout.headerFlex} ${STYLE_CONSTANTS.layout.headerHeight}`}>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className={`${STYLE_CONSTANTS.button.ghost} ${STYLE_CONSTANTS.button.sizes.sm}`}
            >
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Dialog open={editProjectDialog.isOpen} onOpenChange={editProjectDialog.onOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openEditProjectDialog}
                    className={`${STYLE_CONSTANTS.button.neutral} ${STYLE_CONSTANTS.button.sizes.sm}`}
                  >
                    Edit
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Badge variant={getStatusVariant(project.status)} className="capitalize px-2 py-1 text-xs font-medium rounded">
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className={STYLE_CONSTANTS.layout.contentContainer}>
        {/* Project Header */}
        <div className="mb-8">
          <h1 className={STYLE_CONSTANTS.typography.pageTitle}>
            {project.name}
          </h1>
          {project.description && (
            <p className={STYLE_CONSTANTS.typography.description}>{project.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className={`xl:col-span-3 ${STYLE_CONSTANTS.spacing.section}`}>
            {/* Activity Overview Card */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.blueHeader} ${STYLE_CONSTANTS.card.headerWithColor}`}>
                <CardTitle className={STYLE_CONSTANTS.typography.cardTitle}>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent className={STYLE_CONSTANTS.card.content}>
                <ActivityGrid 
                  events={events}
                  startDate={startDate}
                  endDate={project.endDate ? endDate : undefined}
                />
              </CardContent>
            </Card>

            {/* Project Events Card */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.blueHeader} ${STYLE_CONSTANTS.card.headerWithColor}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className={STYLE_CONSTANTS.typography.cardTitle}>Project Events</CardTitle>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Select value={eventFilter} onValueChange={(value: any) => setEventFilter(value)}>
                      <SelectTrigger className="w-full sm:w-44 bg-white/10 border-white/20 text-white h-8 rounded text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                        <SelectItem value="all">All Events ({events.length})</SelectItem>
                        <SelectItem value="notyet">Not Yet ({events.filter(e => e.status === 'notyet').length})</SelectItem>
                        <SelectItem value="ongoing">Ongoing ({events.filter(e => e.status === 'ongoing').length})</SelectItem>
                        <SelectItem value="done">Done ({events.filter(e => e.status === 'done').length})</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={addEventDialog.isOpen} onOpenChange={addEventDialog.onOpenChange}>
                      <DialogTrigger asChild>
                        <Button className={`${STYLE_CONSTANTS.button.white} text-blue-600 ${STYLE_CONSTANTS.button.sizes.sm}`}>
                          Add Event
                        </Button>
                      </DialogTrigger>


                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={STYLE_CONSTANTS.card.content}>
                <div className="space-y-4">
                  {getFilteredEvents().length > 0 ? (
                    getFilteredEvents().map(event => (
                      <EventCard
                        key={event._id}
                        event={event}
                        participants={extractUsersFromParticipants(project)}
                        onStatusChange={handleEventStatusChange}
                        onEventUpdated={handleEventUpdated}
                        onEventDeleted={handleEventDeleted}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-neutral-500 text-base mb-2">No events found</div>
                      <p className="text-neutral-400 text-sm">
                        {eventFilter === 'all' 
                          ? 'This project doesn\'t have any events yet.'
                          : `No events with status "${eventFilter}" found.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className={STYLE_CONSTANTS.spacing.section}>
            {/* Project Details Card */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.darkBlueHeader} ${STYLE_CONSTANTS.card.contentCompact} border-0`}>
                <CardTitle className={STYLE_CONSTANTS.typography.cardTitleSmall}>Project Details</CardTitle>
              </CardHeader>
              <CardContent className={`${STYLE_CONSTANTS.card.contentCompact} space-y-4 text-sm`}>
                <div className="space-y-1">
                  <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Start Date</span>
                  <div className="font-medium text-neutral-900">{formatDate(project.startDate)}</div>
                </div>
                
                {project.endDate && (
                  <div className="space-y-1">
                    <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">End Date</span>
                    <div className="font-medium text-neutral-900">{formatDate(project.endDate)}</div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Participants</span>
                  <div className="font-medium text-neutral-900">{project.participants?.length || 0}</div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Total Events</span>
                  <div className="font-medium text-neutral-900">{events.length}</div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Analysis Card */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.darkBlueHeader} ${STYLE_CONSTANTS.card.contentCompact} border-0`}>
                <CardTitle className={STYLE_CONSTANTS.typography.cardTitleSmall}>Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className={`${STYLE_CONSTANTS.card.contentCompact} space-y-4 text-sm`}>
                <div className="space-y-1">
                  <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Actual Cost</span>
                  <div className="font-semibold text-lg text-neutral-900">{formatCurrency(actualCost)}</div>
                </div>
                
                {project.estimatedCost && (
                  <div className="space-y-1">
                    <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Estimated Cost</span>
                    <div className="font-medium text-neutral-900">{formatCurrency(project.estimatedCost)}</div>
                  </div>
                )}
                
                {project.budget && (
                  <>
                    <div className="space-y-1">
                      <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Budget</span>
                      <div className="font-medium text-neutral-900">{formatCurrency(project.budget)}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Budget Usage</span>
                      <div className={`font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                        {budgetUsage.toFixed(1)}%
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Structure - Hierarchical Participant Groups */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.darkBlueHeader} ${STYLE_CONSTANTS.card.contentCompact} border-0`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={STYLE_CONSTANTS.typography.cardTitleSmall}>Team Structure</CardTitle>
                  <Dialog open={addParticipantGroupDialog.isOpen} onOpenChange={addParticipantGroupDialog.onOpenChange}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => addParticipantGroupDialog.open()}
                        className={`${STYLE_CONSTANTS.button.white} text-blue-800 ${STYLE_CONSTANTS.button.sizes.xs}`}
                      >
                        + Group
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className={`${STYLE_CONSTANTS.card.contentCompact} space-y-4`}>
                {project.participants && project.participants.length > 0 ? (
                  project.participants.map(participantGroup => (
                    <div key={participantGroup._id} className="border border-neutral-200 rounded-lg p-3 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <span className="text-blue-600">◆</span>
                            {participantGroup.name}
                          </div>
                          {participantGroup.description && (
                            <div className="text-xs text-neutral-500 ml-5 mt-1">{participantGroup.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => openAddMemberDialog(participantGroup)}
                            className="h-6 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            onClick={() => handleDeleteParticipantGroup(participantGroup._id)}
                            className="h-6 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {participantGroup.members && participantGroup.members.length > 0 ? (
                        <div className="space-y-2 pl-4 mt-3">
                          {participantGroup.members.map(member => (
                            <div key={member.user._id} className="flex items-center justify-between p-2 bg-neutral-50 rounded group">
                              <div className="flex-1">
                                <div className="font-medium text-neutral-900 text-sm">{member.user.name}</div>
                                <div className="text-xs text-neutral-500">
                                  {member.roles.join(', ')} • {member.user.level}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="font-medium text-neutral-900 text-sm">{formatCurrency(member.user.dailyFee)}/day</div>
                                </div>
                                <Button
                                  onClick={() => handleRemoveMember(participantGroup._id, member.user._id)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-700 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 italic pl-4 mt-2">No members yet</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-neutral-500 text-sm mb-2">No participant groups</div>
                    <p className="text-neutral-400 text-xs">Add a group to organize team members</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Sources */}
            <Card className={STYLE_CONSTANTS.card.base}>
              <CardHeader className={`${STYLE_CONSTANTS.card.darkBlueHeader} ${STYLE_CONSTANTS.card.contentCompact} border-0`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={STYLE_CONSTANTS.typography.cardTitleSmall}>External Sources</CardTitle>
                  <Dialog open={addExternalSourceDialog.isOpen} onOpenChange={addExternalSourceDialog.onOpenChange}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => addExternalSourceDialog.open()}
                        className={`${STYLE_CONSTANTS.button.white} text-blue-800 ${STYLE_CONSTANTS.button.sizes.xs}`}
                      >
                        + Add
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className={STYLE_CONSTANTS.card.contentCompact}>
                {externalSources.length > 0 ? (
                  <div className="space-y-3">
                    {externalSources.map(source => (
                      <ExternalSourceCard
                        key={source._id}
                        source={source}
                        projectId={project?._id}
                        onEdit={openEditExternalSourceDialog}
                        onTestConnection={handleTestConnection}
                        onTriggerSync={handleTriggerSync}
                        onDelete={handleDeleteExternalSource}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-neutral-500 text-sm mb-2">No external sources</div>
                    <p className="text-neutral-400 text-xs">Connect to Jira, GitHub, or Confluence</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <AddEventDialog
        isOpen={addEventDialog.isOpen}
        onOpenChange={addEventDialog.onOpenChange}
        onSubmit={handleCreateEvent}
        users={extractUsersFromParticipants(project)}
        usersLoading={false}
        isLoading={addEventLoading.isLoading}
      />

      {/* Add External Source Dialog */}
      <AddExternalSourceDialog
        isOpen={addExternalSourceDialog.isOpen}
        onOpenChange={addExternalSourceDialog.onOpenChange}
        onSubmit={handleCreateExternalSource}
        isLoading={addExternalSourceLoading.isLoading}
      />

      {/* Edit External Source Dialog */}
      <EditExternalSourceDialog
        isOpen={editExternalSourceDialog.isOpen}
        onOpenChange={editExternalSourceDialog.onOpenChange}
        onSubmit={handleEditExternalSource}
        externalSource={editingExternalSource}
        projectId={project?._id || ''}
        isLoading={editExternalSourceLoading.isLoading}
      />

      {/* Edit Project Dialog */}
      <EditProjectDialog
        isOpen={editProjectDialog.isOpen}
        onOpenChange={editProjectDialog.onOpenChange}
        onSubmit={handleUpdateProject}
        project={project}
        isLoading={editProjectLoading.isLoading}
      />

      {/* Add Participant Group Dialog */}
      <AddParticipantGroupDialog
        isOpen={addParticipantGroupDialog.isOpen}
        onOpenChange={addParticipantGroupDialog.onOpenChange}
        onSubmit={handleCreateParticipantGroup}
        existingGroups={project?.participants || []}
        isLoading={addParticipantGroupLoading.isLoading}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={addMemberDialog.isOpen}
        onOpenChange={addMemberDialog.onOpenChange}
        onSubmit={handleAddMember}
        availableUsers={allUsers}
        existingMemberIds={selectedGroupForMember?.members.map(m => m.user._id) || []}
        isLoading={addMemberLoading.isLoading}
        groupName={selectedGroupForMember?.name || ''}
      />
    </div>
  );
};

export default Project;