import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project as ProjectType, Event, User, ExternalSourceConfig } from '../types';
import { projectApi, eventApi, userApi, externalSourceApi } from '@/services/api';
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
  type EditExternalSourceFormData
} from '../components/dialogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useDialog, useFormLoading } from '@/hooks/useDialog';

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
  
  // Loading states using custom hooks
  const addEventLoading = useFormLoading();
  const addExternalSourceLoading = useFormLoading();
  const editExternalSourceLoading = useFormLoading();
  
  // External source editing state
  const [editingExternalSource, setEditingExternalSource] = useState<ExternalSourceConfig | null>(null);

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



  const getExternalSourceIcon = (type: string) => {
    switch (type) {
      case 'jira': return '🎯';
      case 'github': return '📚';
      case 'confluence': return '📖';
      default: return '🔗';
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
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
                        participants={allUsers}
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

            {/* Team Members */}
            {project.participants && project.participants.length > 0 && (
              <Card className={STYLE_CONSTANTS.card.base}>
                <CardHeader className={`${STYLE_CONSTANTS.card.darkBlueHeader} ${STYLE_CONSTANTS.card.contentCompact} border-0`}>
                  <CardTitle className={STYLE_CONSTANTS.typography.cardTitleSmall}>Team Members</CardTitle>
                </CardHeader>
                <CardContent className={`${STYLE_CONSTANTS.card.contentCompact} space-y-3`}>
                  {project.participants.map(participant => (
                    <div key={participant._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                      <div>
                        <div className="font-medium text-neutral-900 text-sm">{participant.name}</div>
                        <div className="text-xs text-neutral-500">{participant.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">{participant.level}</div>
                        <div className="font-medium text-neutral-900 text-sm">{formatCurrency(participant.dailyFee)}/day</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
                    {externalSources.map(source => {
                      const projectMapping = source.projectMappings.find(
                        mapping => mapping.internalProjectId === project?._id
                      );
                      return (
                        <div key={source._id} className="p-3 bg-neutral-50 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{getExternalSourceIcon(source.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <div className="font-medium text-neutral-900 text-sm">{source.name}</div>
                                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    source.isActive 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-red-100 text-red-700 border border-red-200'
                                  }`}>
                                    {source.isActive ? 'Active' : 'Disabled'}
                                  </div>
                                </div>
                                <div className="text-xs text-neutral-500 capitalize">{source.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditExternalSourceDialog(source)}
                                className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
                                title="Edit"
                              >
                                ✏️
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestConnection(source._id)}
                                className="h-6 w-6 p-0 hover:bg-green-100 text-green-600"
                                title="Test Connection"
                              >
                                🔧
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTriggerSync(source._id)}
                                className="h-6 w-6 p-0 hover:bg-orange-100 text-orange-600"
                                title="Trigger Sync"
                              >
                                🔄
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExternalSource(source._id)}
                                className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                                title="Remove"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500 space-y-1">
                            <div>External ID: <span className="font-mono">{projectMapping?.externalId}</span></div>
                            <div>Last Sync: {formatLastSync(source.lastSyncAt)}</div>
                            <div>Sync Every: {source.syncFrequency}h</div>
                          </div>
                        </div>
                      );
                    })}
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
        users={allUsers}
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
    </div>
  );
};

export default Project;