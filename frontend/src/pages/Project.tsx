import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project as ProjectType, Event, User } from '../types';
import { projectApi, eventApi, userApi } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '../utils/costUtils';
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
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
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

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-start-date" className="text-sm font-medium text-neutral-900">Start Date *</Label>
                              <Input
                                id="event-start-date"
                                type="datetime-local"
                                value={eventFormData.startDate}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                required
                                disabled={createEventLoading}
                                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-end-date" className="text-sm font-medium text-neutral-900">End Date</Label>
                              <Input
                                id="event-end-date"
                                type="datetime-local"
                                value={eventFormData.endDate}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                disabled={createEventLoading}
                                className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                              />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;