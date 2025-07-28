import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project as ProjectType, Event, User, ExternalSourceConfig } from '../types';
import { projectApi, eventApi, userApi, externalSourceApi } from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '@/utils/costUtils';
import EventCard from '../components/EventCard';
import ActivityGrid from '../components/ActivityGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Add Event dialog state
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    type: 'one-time' as 'one-time' | 'duration',
    status: 'notyet' as 'notyet' | 'ongoing' | 'done',
    startDate: '',
    endDate: '',
    estimatedHours: '',
    actualHours: '',
    participants: [] as string[],
    referenceLinks: [{ title: '', url: '', type: 'other' as 'jira' | 'github' | 'confluence' | 'other' }]
  });

  // External Source dialog state
  const [showAddExternalSourceDialog, setShowAddExternalSourceDialog] = useState(false);
  const [showEditExternalSourceDialog, setShowEditExternalSourceDialog] = useState(false);
  const [createExternalSourceLoading, setCreateExternalSourceLoading] = useState(false);
  const [editingExternalSource, setEditingExternalSource] = useState<ExternalSourceConfig | null>(null);
  const [externalSourceFormData, setExternalSourceFormData] = useState({
    name: '',
    type: 'jira' as 'jira' | 'github' | 'confluence',
    baseUrl: '',
    credentials: {
      username: '',
      token: '',
      apiKey: ''
    },
    syncFrequency: 24,
    externalId: '',
    isActive: true
  });

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

  const handleCreateExternalSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalSourceFormData.name.trim() || !externalSourceFormData.baseUrl.trim() || 
        !externalSourceFormData.credentials.token.trim() || !externalSourceFormData.externalId.trim() || !project) return;

    try {
      setCreateExternalSourceLoading(true);
      const externalSourceData = {
        name: externalSourceFormData.name.trim(),
        type: externalSourceFormData.type,
        baseUrl: externalSourceFormData.baseUrl.trim(),
        credentials: {
          username: externalSourceFormData.credentials.username.trim() || undefined,
          token: externalSourceFormData.credentials.token.trim(),
          apiKey: externalSourceFormData.credentials.apiKey.trim() || undefined
        },
        syncFrequency: externalSourceFormData.syncFrequency,
        isActive: externalSourceFormData.isActive,
        projectMappings: [{
          externalId: externalSourceFormData.externalId.trim(),
          internalProjectId: project._id
        }]
      };
      
      const response = await externalSourceApi.create(externalSourceData as any);
      const newExternalSource = response.data;
      
      setExternalSources([...externalSources, newExternalSource]);
      setShowAddExternalSourceDialog(false);
      resetExternalSourceForm();
    } catch (err) {
      console.error('Error creating external source:', err);
      setError('Failed to create external source');
    } finally {
      setCreateExternalSourceLoading(false);
    }
  };

  const handleEditExternalSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExternalSource || !externalSourceFormData.name.trim() || !externalSourceFormData.baseUrl.trim() || 
        !externalSourceFormData.credentials.token.trim() || !externalSourceFormData.externalId.trim() || !project) return;

    try {
      setCreateExternalSourceLoading(true);
      
      // Find existing mapping for this project or create new one
      const existingMappings = editingExternalSource.projectMappings.filter(
        mapping => mapping.internalProjectId !== project._id
      );
      const updatedMappings = [
        ...existingMappings,
        {
          externalId: externalSourceFormData.externalId.trim(),
          internalProjectId: project._id
        }
      ];
      
      const updateData = {
        name: externalSourceFormData.name.trim(),
        type: externalSourceFormData.type,
        baseUrl: externalSourceFormData.baseUrl.trim(),
        credentials: {
          username: externalSourceFormData.credentials.username.trim() || undefined,
          token: externalSourceFormData.credentials.token.trim(),
          apiKey: externalSourceFormData.credentials.apiKey.trim() || undefined
        },
        syncFrequency: externalSourceFormData.syncFrequency,
        isActive: externalSourceFormData.isActive,
        projectMappings: updatedMappings
      };
      
      await externalSourceApi.update(editingExternalSource._id, updateData);
      await loadExternalSources(project._id);
      setShowEditExternalSourceDialog(false);
      setEditingExternalSource(null);
      resetExternalSourceForm();
    } catch (err) {
      console.error('Error updating external source:', err);
      setError('Failed to update external source');
    } finally {
      setCreateExternalSourceLoading(false);
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
    if (!project) return;
    
    const projectMapping = externalSource.projectMappings.find(
      mapping => mapping.internalProjectId === project._id
    );
    
    setEditingExternalSource(externalSource);
    setExternalSourceFormData({
      name: externalSource.name,
      type: externalSource.type,
      baseUrl: externalSource.baseUrl,
      credentials: {
        username: '',
        token: '',
        apiKey: ''
      },
      syncFrequency: externalSource.syncFrequency,
      externalId: projectMapping?.externalId || '',
      isActive: externalSource.isActive
    });
    setShowEditExternalSourceDialog(true);
  };

  const resetExternalSourceForm = () => {
    setExternalSourceFormData({
      name: '',
      type: 'jira',
      baseUrl: '',
      credentials: {
        username: '',
        token: '',
        apiKey: ''
      },
      syncFrequency: 24,
      externalId: '',
      isActive: true
    });
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !eventFormData.startDate || !project) return;

    try {
      setCreateEventLoading(true);
      const eventData = {
        title: eventFormData.title.trim(),
        description: eventFormData.description.trim() || undefined,
        type: eventFormData.type,
        status: eventFormData.status,
        startDate: new Date(eventFormData.startDate),
        endDate: eventFormData.endDate ? new Date(eventFormData.endDate) : undefined,
        estimatedHours: eventFormData.estimatedHours ? parseFloat(eventFormData.estimatedHours) : undefined,
        actualHours: eventFormData.actualHours ? parseFloat(eventFormData.actualHours) : undefined,
        participants: eventFormData.participants,
        referenceLinks: eventFormData.referenceLinks.filter(link => link.title.trim() && link.url.trim()),
        projectId: project._id
      };
      
      const response = await eventApi.create(eventData as any);
      const newEvent = response.data;
      
      setEvents([...events, newEvent]);
      setShowAddEventDialog(false);
      setEventFormData({
        title: '',
        description: '',
        type: 'one-time',
        status: 'notyet',
        startDate: '',
        endDate: '',
        estimatedHours: '',
        actualHours: '',
        participants: [],
        referenceLinks: [{ title: '', url: '', type: 'other' }]
      });
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setCreateEventLoading(false);
    }
  };

  const handleParticipantToggle = (userId: string) => {
    setEventFormData(prev => ({
      ...prev,
      participants: prev.participants.indexOf(userId) !== -1
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }));
  };

  const handleReferenceLinkChange = (index: number, field: 'title' | 'url' | 'type', value: string) => {
    const newLinks = [...eventFormData.referenceLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setEventFormData(prev => ({ ...prev, referenceLinks: newLinks }));
  };

  const addReferenceLink = () => {
    setEventFormData(prev => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, { title: '', url: '', type: 'other' }]
    }));
  };

  const removeReferenceLink = (index: number) => {
    if (eventFormData.referenceLinks.length > 1) {
      const newLinks = eventFormData.referenceLinks.filter((_, i) => i !== index);
      setEventFormData(prev => ({ ...prev, referenceLinks: newLinks }));
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded shadow-elevation-16 border border-neutral-200">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-600 text-sm font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 bg-white p-8 rounded shadow-elevation-16 border border-neutral-200 max-w-md w-full">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {error || 'Project not found'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium px-4 py-2 h-8 text-sm"
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
    <div className="min-h-screen bg-neutral-50">
      {/* Fluent 2 Header - Clean and minimal */}
      <div className="bg-white shadow-elevation-4 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded px-3 py-1.5 h-8 text-sm font-medium"
            >
              ← Back to Dashboard
            </Button>
            
            <Badge variant={getStatusVariant(project.status)} className="capitalize px-2 py-1 text-xs font-medium rounded">
              {project.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Fluent 2 Typography - Clean, readable */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2 tracking-normal">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-neutral-600 text-base max-w-4xl leading-relaxed">{project.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Fluent 2 Cards - Clean, elevated */}
            <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
              <CardHeader className="bg-blue-600 text-white p-6 border-0">
                <CardTitle className="text-lg font-semibold">Activity Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ActivityGrid 
                  events={events} 
                  startDate={adjustedStartDate}
                  endDate={new Date()}
                />
              </CardContent>
            </Card>

            {/* Project Events Card */}
            <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
              <CardHeader className="bg-blue-600 text-white p-6 border-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold">Project Events</CardTitle>
                  
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

                    <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-white text-blue-600 hover:bg-neutral-50 border-0 rounded font-medium px-4 py-1.5 h-8 text-sm">
                          Add Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-elevation-64 border border-neutral-200">
                        <DialogHeader className="p-6 pb-0">
                          <DialogTitle className="text-xl font-semibold text-neutral-900">Create New Event</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateEvent} className="p-6 pt-4 space-y-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-title" className="text-sm font-medium text-neutral-900">Title *</Label>
                              <Input
                                id="event-title"
                                value={eventFormData.title}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter event title"
                                required
                                disabled={createEventLoading}
                                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-type" className="text-sm font-medium text-neutral-900">Type *</Label>
                              <Select value={eventFormData.type} onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger className="h-8 rounded border-neutral-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                                  <SelectItem value="one-time">One-time</SelectItem>
                                  <SelectItem value="duration">Duration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="event-description" className="text-sm font-medium text-neutral-900">Description</Label>
                            <textarea
                              id="event-description"
                              value={eventFormData.description}
                              onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter event description"
                              rows={3}
                              className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-none text-sm"
                              disabled={createEventLoading}
                              aria-label="Event description"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-status" className="text-sm font-medium text-neutral-900">Status *</Label>
                              <Select value={eventFormData.status} onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger className="h-8 rounded border-neutral-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                                  <SelectItem value="notyet">Not Yet</SelectItem>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Start Date and Time */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-neutral-900">Start Date & Time *</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label htmlFor="event-start-date" className="text-xs text-neutral-600">Date</Label>
                                  <Input
                                    id="event-start-date"
                                    type="date"
                                    value={eventFormData.startDate ? eventFormData.startDate.split('T')[0] : ''}
                                    onChange={(e) => {
                                      const time = eventFormData.startDate ? eventFormData.startDate.split('T')[1] || '09:00' : '09:00';
                                      setEventFormData(prev => ({ 
                                        ...prev, 
                                        startDate: e.target.value ? `${e.target.value}T${time}` : ''
                                      }));
                                    }}
                                    required
                                    disabled={createEventLoading}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="event-start-time" className="text-xs text-neutral-600">Time</Label>
                                  <Input
                                    id="event-start-time"
                                    type="time"
                                    value={eventFormData.startDate ? eventFormData.startDate.split('T')[1] || '09:00' : '09:00'}
                                    onChange={(e) => {
                                      const date = eventFormData.startDate ? eventFormData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                      setEventFormData(prev => ({ 
                                        ...prev, 
                                        startDate: `${date}T${e.target.value}`
                                      }));
                                    }}
                                    disabled={createEventLoading}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* End Date and Time */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-neutral-900">End Date & Time (Optional)</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label htmlFor="event-end-date" className="text-xs text-neutral-600">Date</Label>
                                  <Input
                                    id="event-end-date"
                                    type="date"
                                    value={eventFormData.endDate ? eventFormData.endDate.split('T')[0] : ''}
                                    onChange={(e) => {
                                      if (!e.target.value) {
                                        setEventFormData(prev => ({ ...prev, endDate: '' }));
                                        return;
                                      }
                                      const time = eventFormData.endDate ? eventFormData.endDate.split('T')[1] || '17:00' : '17:00';
                                      setEventFormData(prev => ({ 
                                        ...prev, 
                                        endDate: `${e.target.value}T${time}`
                                      }));
                                    }}
                                    disabled={createEventLoading}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="event-end-time" className="text-xs text-neutral-600">Time</Label>
                                  <Input
                                    id="event-end-time"
                                    type="time"
                                    value={eventFormData.endDate ? eventFormData.endDate.split('T')[1] || '17:00' : '17:00'}
                                    onChange={(e) => {
                                      const date = eventFormData.endDate ? 
                                        eventFormData.endDate.split('T')[0] : 
                                        (eventFormData.startDate ? eventFormData.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                                      setEventFormData(prev => ({ 
                                        ...prev, 
                                        endDate: `${date}T${e.target.value}`
                                      }));
                                    }}
                                    disabled={createEventLoading || !eventFormData.endDate}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <input
                                  type="checkbox"
                                  id="clear-end-date"
                                  checked={!eventFormData.endDate}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEventFormData(prev => ({ ...prev, endDate: '' }));
                                    } else {
                                      const startDate = eventFormData.startDate ? eventFormData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                      setEventFormData(prev => ({ ...prev, endDate: `${startDate}T17:00` }));
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600"
                                  disabled={createEventLoading}
                                  title="Toggle one-time event (no end date)"
                                />
                                <Label htmlFor="clear-end-date" className="text-xs text-neutral-600 cursor-pointer">
                                  One-time event (no end date)
                                </Label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-estimated-hours" className="text-sm font-medium text-neutral-900">Estimated Hours</Label>
                              <Input
                                id="event-estimated-hours"
                                type="number"
                                min="0"
                                step="0.1"
                                value={eventFormData.estimatedHours}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                                placeholder="Enter estimated hours"
                                disabled={createEventLoading}
                                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-actual-hours" className="text-sm font-medium text-neutral-900">Actual Hours</Label>
                              <Input
                                id="event-actual-hours"
                                type="number"
                                min="0"
                                step="0.1"
                                value={eventFormData.actualHours}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, actualHours: e.target.value }))}
                                placeholder="Enter actual hours"
                                disabled={createEventLoading}
                                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-neutral-900">Participants</Label>
                            <div className="max-h-32 overflow-y-auto border border-neutral-300 rounded p-3 space-y-2 bg-neutral-50">
                              {allUsers.map(user => (
                                <div key={user._id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`event-participant-${user._id}`}
                                    checked={eventFormData.participants.indexOf(user._id) !== -1}
                                    onChange={() => handleParticipantToggle(user._id)}
                                    className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600"
                                    disabled={createEventLoading}
                                    aria-labelledby={`event-participant-label-${user._id}`}
                                    title={`Select ${user.name} as participant`}
                                  />
                                  <Label 
                                    htmlFor={`event-participant-${user._id}`} 
                                    id={`event-participant-label-${user._id}`}
                                    className="text-sm text-neutral-700 cursor-pointer"
                                  >
                                    {user.name} ({user.email})
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-neutral-900">Reference Links</Label>
                            {eventFormData.referenceLinks.map((link, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                  <Input
                                    placeholder="Link title"
                                    value={link.title}
                                    onChange={(e) => handleReferenceLinkChange(index, 'title', e.target.value)}
                                    disabled={createEventLoading}
                                    aria-label={`Reference link ${index + 1} title`}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Input
                                    placeholder="URL"
                                    value={link.url}
                                    onChange={(e) => handleReferenceLinkChange(index, 'url', e.target.value)}
                                    disabled={createEventLoading}
                                    aria-label={`Reference link ${index + 1} URL`}
                                    className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Select value={link.type} onValueChange={(value: any) => handleReferenceLinkChange(index, 'type', value)}>
                                    <SelectTrigger className="rounded border-neutral-300 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                                      <SelectItem value="jira">Jira</SelectItem>
                                      <SelectItem value="github">GitHub</SelectItem>
                                      <SelectItem value="confluence">Confluence</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-1">
                                  {eventFormData.referenceLinks.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeReferenceLink(index)}
                                      disabled={createEventLoading}
                                      className="h-8 w-8 rounded hover:bg-red-50 hover:text-red-600 p-0"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addReferenceLink}
                              disabled={createEventLoading}
                              className="rounded border-neutral-300 hover:bg-neutral-50 h-8 text-sm"
                            >
                              + Add Link
                            </Button>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddEventDialog(false)}
                              disabled={createEventLoading}
                              className="rounded px-4 py-1.5 h-8 text-sm border-neutral-300 hover:bg-neutral-50"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createEventLoading || !eventFormData.title.trim() || !eventFormData.startDate}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium px-4 py-1.5 h-8 text-sm"
                            >
                              {createEventLoading ? 'Creating...' : 'Create Event'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  {getFilteredEvents().length > 0 ? (
                    getFilteredEvents().map(event => (
                      <EventCard
                        key={event._id}
                        event={event}
                        participants={allUsers}
                        onStatusChange={handleEventStatusChange}
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
          <div className="space-y-6">
            {/* Project Details Card */}
            <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
              <CardHeader className="bg-blue-800 text-white p-4 border-0">
                <CardTitle className="text-base font-semibold">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
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
            <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
              <CardHeader className="bg-blue-800 text-white p-4 border-0">
                <CardTitle className="text-base font-semibold">Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
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
              <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
                <CardHeader className="bg-blue-800 text-white p-4 border-0">
                  <CardTitle className="text-base font-semibold">Team Members</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
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
            <Card className="bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden">
              <CardHeader className="bg-blue-800 text-white p-4 border-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">External Sources</CardTitle>
                  <Dialog open={showAddExternalSourceDialog} onOpenChange={setShowAddExternalSourceDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setShowAddExternalSourceDialog(true)}
                        className="bg-white text-blue-800 hover:bg-neutral-50 border-0 rounded font-medium px-2 py-1 h-6 text-xs"
                      >
                        + Add
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4">
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

      {/* Add External Source Dialog */}
      <Dialog open={showAddExternalSourceDialog} onOpenChange={setShowAddExternalSourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-elevation-64 border border-neutral-200">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-neutral-900">Add External Source</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateExternalSource} className="p-6 pt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="external-source-name" className="text-sm font-medium text-neutral-900">Name *</Label>
                <Input
                  id="external-source-name"
                  value={externalSourceFormData.name}
                  onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Jira Instance"
                  required
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="external-source-type" className="text-sm font-medium text-neutral-900">Type *</Label>
                <Select value={externalSourceFormData.type} onValueChange={(value: any) => setExternalSourceFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-8 rounded border-neutral-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="confluence">Confluence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-source-base-url" className="text-sm font-medium text-neutral-900">Base URL *</Label>
              <Input
                id="external-source-base-url"
                value={externalSourceFormData.baseUrl}
                onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="e.g., https://yourcompany.atlassian.net or https://api.github.com"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-source-external-id" className="text-sm font-medium text-neutral-900">External Project ID *</Label>
              <Input
                id="external-source-external-id"
                value={externalSourceFormData.externalId}
                onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, externalId: e.target.value }))}
                placeholder="e.g., PROJECT-KEY for Jira, owner/repo for GitHub"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="external-source-username" className="text-sm font-medium text-neutral-900">Username/Email</Label>
                <Input
                  id="external-source-username"
                  value={externalSourceFormData.credentials.username}
                  onChange={(e) => setExternalSourceFormData(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, username: e.target.value }
                  }))}
                  placeholder="Your username or email"
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="external-source-sync-frequency" className="text-sm font-medium text-neutral-900">Sync Frequency (hours) *</Label>
                <Input
                  id="external-source-sync-frequency"
                  type="number"
                  min="1"
                  value={externalSourceFormData.syncFrequency}
                  onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, syncFrequency: parseInt(e.target.value) || 24 }))}
                  required
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-source-token" className="text-sm font-medium text-neutral-900">API Token/Key *</Label>
              <Input
                id="external-source-token"
                type="password"
                value={externalSourceFormData.credentials.token}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, token: e.target.value }
                }))}
                placeholder="Your API token or personal access token"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-source-api-key" className="text-sm font-medium text-neutral-900">Additional API Key</Label>
              <Input
                id="external-source-api-key"
                type="password"
                value={externalSourceFormData.credentials.apiKey}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, apiKey: e.target.value }
                }))}
                placeholder="Optional additional API key"
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="external-source-active"
                checked={externalSourceFormData.isActive}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  isActive: e.target.checked 
                }))}
                disabled={createExternalSourceLoading}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600"
                title="Enable external source for syncing"
              />
              <Label htmlFor="external-source-active" className="text-sm font-medium text-neutral-900 cursor-pointer">
                Active to Sync
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddExternalSourceDialog(false);
                  resetExternalSourceForm();
                }}
                disabled={createExternalSourceLoading}
                className="rounded px-4 py-1.5 h-8 text-sm border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExternalSourceLoading || !externalSourceFormData.name.trim() || 
                         !externalSourceFormData.baseUrl.trim() || !externalSourceFormData.credentials.token.trim() ||
                         !externalSourceFormData.externalId.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium px-4 py-1.5 h-8 text-sm"
              >
                {createExternalSourceLoading ? 'Creating...' : 'Add External Source'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit External Source Dialog */}
      <Dialog open={showEditExternalSourceDialog} onOpenChange={setShowEditExternalSourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-elevation-64 border border-neutral-200">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-neutral-900">Edit External Source</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditExternalSource} className="p-6 pt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-external-source-name" className="text-sm font-medium text-neutral-900">Name *</Label>
                <Input
                  id="edit-external-source-name"
                  value={externalSourceFormData.name}
                  onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Jira Instance"
                  required
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-external-source-type" className="text-sm font-medium text-neutral-900">Type *</Label>
                <Select value={externalSourceFormData.type} onValueChange={(value: any) => setExternalSourceFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-8 rounded border-neutral-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="confluence">Confluence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external-source-base-url" className="text-sm font-medium text-neutral-900">Base URL *</Label>
              <Input
                id="edit-external-source-base-url"
                value={externalSourceFormData.baseUrl}
                onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="e.g., https://yourcompany.atlassian.net or https://api.github.com"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external-source-external-id" className="text-sm font-medium text-neutral-900">External Project ID *</Label>
              <Input
                id="edit-external-source-external-id"
                value={externalSourceFormData.externalId}
                onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, externalId: e.target.value }))}
                placeholder="e.g., PROJECT-KEY for Jira, owner/repo for GitHub"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-external-source-username" className="text-sm font-medium text-neutral-900">Username/Email</Label>
                <Input
                  id="edit-external-source-username"
                  value={externalSourceFormData.credentials.username}
                  onChange={(e) => setExternalSourceFormData(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, username: e.target.value }
                  }))}
                  placeholder="Your username or email"
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-external-source-sync-frequency" className="text-sm font-medium text-neutral-900">Sync Frequency (hours) *</Label>
                <Input
                  id="edit-external-source-sync-frequency"
                  type="number"
                  min="1"
                  value={externalSourceFormData.syncFrequency}
                  onChange={(e) => setExternalSourceFormData(prev => ({ ...prev, syncFrequency: parseInt(e.target.value) || 24 }))}
                  required
                  disabled={createExternalSourceLoading}
                  className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external-source-token" className="text-sm font-medium text-neutral-900">API Token/Key *</Label>
              <Input
                id="edit-external-source-token"
                type="password"
                value={externalSourceFormData.credentials.token}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, token: e.target.value }
                }))}
                placeholder="Your API token or personal access token"
                required
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external-source-api-key" className="text-sm font-medium text-neutral-900">Additional API Key</Label>
              <Input
                id="edit-external-source-api-key"
                type="password"
                value={externalSourceFormData.credentials.apiKey}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, apiKey: e.target.value }
                }))}
                placeholder="Optional additional API key"
                disabled={createExternalSourceLoading}
                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-external-source-active"
                checked={externalSourceFormData.isActive}
                onChange={(e) => setExternalSourceFormData(prev => ({ 
                  ...prev, 
                  isActive: e.target.checked 
                }))}
                disabled={createExternalSourceLoading}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600"
                title="Enable external source for syncing"
              />
              <Label htmlFor="edit-external-source-active" className="text-sm font-medium text-neutral-900 cursor-pointer">
                Enable external source
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditExternalSourceDialog(false);
                  setEditingExternalSource(null);
                  resetExternalSourceForm();
                }}
                disabled={createExternalSourceLoading}
                className="rounded px-4 py-1.5 h-8 text-sm border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExternalSourceLoading || !externalSourceFormData.name.trim() || 
                         !externalSourceFormData.baseUrl.trim() || !externalSourceFormData.credentials.token.trim() ||
                         !externalSourceFormData.externalId.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium px-4 py-1.5 h-8 text-sm"
              >
                {createExternalSourceLoading ? 'Updating...' : 'Update External Source'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Project;