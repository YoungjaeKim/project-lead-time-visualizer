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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              {error || 'Project not found'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')}>
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
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Dashboard
            </Button>
            
            <Badge variant={getStatusVariant(project.status)} className="capitalize">
              {project.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground text-lg">{project.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityGrid 
                  events={events} 
                  startDate={adjustedStartDate}
                  endDate={new Date()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Events</CardTitle>
                  
                  <div className="flex items-center gap-4">
                    <Select value={eventFilter} onValueChange={(value: any) => setEventFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events ({events.length})</SelectItem>
                        <SelectItem value="notyet">Not Yet ({events.filter(e => e.status === 'notyet').length})</SelectItem>
                        <SelectItem value="ongoing">Ongoing ({events.filter(e => e.status === 'ongoing').length})</SelectItem>
                        <SelectItem value="done">Done ({events.filter(e => e.status === 'done').length})</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
                      <DialogTrigger asChild>
                        <Button>Add Event</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Event</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-title">Title *</Label>
                              <Input
                                id="event-title"
                                value={eventFormData.title}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter event title"
                                required
                                disabled={createEventLoading}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-type">Type *</Label>
                              <Select value={eventFormData.type} onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="one-time">One-time</SelectItem>
                                  <SelectItem value="duration">Duration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="event-description">Description</Label>
                            <textarea
                              id="event-description"
                              value={eventFormData.description}
                              onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter event description"
                              rows={3}
                              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                              disabled={createEventLoading}
                              aria-label="Event description"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-status">Status *</Label>
                              <Select value={eventFormData.status} onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="notyet">Not Yet</SelectItem>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-start-date">Start Date *</Label>
                              <Input
                                id="event-start-date"
                                type="datetime-local"
                                value={eventFormData.startDate}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                required
                                disabled={createEventLoading}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-end-date">End Date</Label>
                              <Input
                                id="event-end-date"
                                type="datetime-local"
                                value={eventFormData.endDate}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                disabled={createEventLoading}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-estimated-hours">Estimated Hours</Label>
                              <Input
                                id="event-estimated-hours"
                                type="number"
                                min="0"
                                step="0.1"
                                value={eventFormData.estimatedHours}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                                placeholder="Enter estimated hours"
                                disabled={createEventLoading}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="event-actual-hours">Actual Hours</Label>
                              <Input
                                id="event-actual-hours"
                                type="number"
                                min="0"
                                step="0.1"
                                value={eventFormData.actualHours}
                                onChange={(e) => setEventFormData(prev => ({ ...prev, actualHours: e.target.value }))}
                                placeholder="Enter actual hours"
                                disabled={createEventLoading}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Participants</Label>
                            <div className="max-h-32 overflow-y-auto border border-input rounded-md p-3 space-y-2">
                              {allUsers.map(user => (
                                <div key={user._id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`event-participant-${user._id}`}
                                    checked={eventFormData.participants.indexOf(user._id) !== -1}
                                    onChange={() => handleParticipantToggle(user._id)}
                                    className="h-4 w-4 text-primary border-input rounded focus:ring-ring"
                                    disabled={createEventLoading}
                                  />
                                  <Label htmlFor={`event-participant-${user._id}`} className="text-sm">
                                    {user.name} ({user.email})
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Reference Links</Label>
                            {eventFormData.referenceLinks.map((link, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                  <Input
                                    placeholder="Link title"
                                    value={link.title}
                                    onChange={(e) => handleReferenceLinkChange(index, 'title', e.target.value)}
                                    disabled={createEventLoading}
                                    aria-label={`Reference link ${index + 1} title`}
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Input
                                    placeholder="URL"
                                    value={link.url}
                                    onChange={(e) => handleReferenceLinkChange(index, 'url', e.target.value)}
                                    disabled={createEventLoading}
                                    aria-label={`Reference link ${index + 1} URL`}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Select value={link.type} onValueChange={(value: any) => handleReferenceLinkChange(index, 'type', value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
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
                            >
                              + Add Link
                            </Button>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddEventDialog(false)}
                              disabled={createEventLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createEventLoading || !eventFormData.title.trim() || !eventFormData.startDate}
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
              
              <CardContent>
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
                    <div className="text-center py-8">
                      <div className="text-muted-foreground text-lg mb-2">No events found</div>
                      <p className="text-muted-foreground">
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Start Date</span>
                  <div className="font-medium">{formatDate(project.startDate)}</div>
                </div>
                
                {project.endDate && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">End Date</span>
                    <div className="font-medium">{formatDate(project.endDate)}</div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="text-muted-foreground">Participants</span>
                  <div className="font-medium">{project.participants?.length || 0}</div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-muted-foreground">Total Events</span>
                  <div className="font-medium">{events.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Actual Cost</span>
                  <div className="font-semibold text-lg">{formatCurrency(actualCost)}</div>
                </div>
                
                {project.estimatedCost && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <div className="font-medium">{formatCurrency(project.estimatedCost)}</div>
                  </div>
                )}
                
                {project.budget && (
                  <>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Budget</span>
                      <div className="font-medium">{formatCurrency(project.budget)}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Budget Usage</span>
                      <div className={`font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                        {budgetUsage.toFixed(1)}%
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {project.participants && project.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.participants.map(participant => (
                    <div key={participant._id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-muted-foreground">{participant.role}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="text-muted-foreground">{participant.level}</div>
                        <div className="font-medium">{formatCurrency(participant.dailyFee)}/day</div>
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