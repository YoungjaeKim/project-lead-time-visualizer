import React, { useState } from 'react';
import { Event, User } from '../types';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency, calculateEventCost } from '../utils/costUtils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { eventApi } from '@/services/api';

interface EventCardProps {
  event: Event;
  participants: User[];
  onStatusChange: (eventId: string, status: 'done' | 'ongoing' | 'notyet') => void;
  onEventUpdated?: (updatedEvent: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, participants, onStatusChange, onEventUpdated }) => {
  const eventCost = calculateEventCost(event, participants);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
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

  const openEditDialog = () => {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toLocalDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toLocalDateTimeString = (d: Date) => `${toLocalDateString(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const startLocal = event.startDate ? toLocalDateTimeString(new Date(event.startDate)) : '';
    const endLocal = event.endDate ? toLocalDateTimeString(new Date(event.endDate)) : '';
    const normalizedParticipantIds = Array.isArray(event.participants)
      ? (event.participants as any[])
          .map((p) => (typeof p === 'string' ? p : (p && p._id) ? (p as any)._id : undefined))
          .filter((v): v is string => Boolean(v))
      : [];

    setEventFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type as 'one-time' | 'duration',
      status: event.status as 'notyet' | 'ongoing' | 'done',
      startDate: startLocal,
      endDate: endLocal,
      estimatedHours: event.estimatedHours ? String(event.estimatedHours) : '',
      actualHours: event.actualHours ? String(event.actualHours) : '',
      participants: normalizedParticipantIds,
      referenceLinks:
        event.referenceLinks && event.referenceLinks.length > 0
          ? event.referenceLinks.map(l => ({ title: l.title || '', url: l.url || '', type: (l.type as any) || 'other' }))
          : [{ title: '', url: '', type: 'other' }]
    });
    setShowEditDialog(true);
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
    newLinks[index] = { ...newLinks[index], [field]: value } as any;
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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !eventFormData.startDate) return;

    try {
      setEditLoading(true);
      const updateData = {
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
      } as any;

      const response = await eventApi.update(event._id, updateData);
      const updated = response.data as Event;
      if (onEventUpdated) {
        onEventUpdated(updated);
      }
      setShowEditDialog(false);
    } catch (err) {
      console.error('Error updating event:', err);
    } finally {
      setEditLoading(false);
    }
  };
  
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'done': return 'default';
      case 'ongoing': return 'secondary';
      case 'notyet': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'duration': return 'secondary';
      case 'one-time': return 'outline';
      default: return 'outline';
    }
  };

  const getReferenceTypeIcon = (type: string) => {
    switch (type) {
      case 'jira': return '🎫';
      case 'github': return '📦';
      case 'confluence': return '📄';
      case 'other': return '🔗';
      default: return '🔗';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'notyet': return 'Not Yet';
      case 'ongoing': return 'Ongoing';
      case 'done': return 'Done';
      default: return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-none tracking-tight mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <Badge variant={getTypeVariant(event.type)} className="capitalize">
              {event.type}
            </Badge>
            
            <Select 
              value={event.status} 
              onValueChange={(value) => onStatusChange(event._id, value as 'done' | 'ongoing' | 'notyet')}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue>
                  <Badge variant={getStatusVariant(event.status)} className="text-xs">
                    {getStatusLabel(event.status)}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-neutral-200 rounded shadow-elevation-16">
                <SelectItem value="notyet">Not Yet</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={openEditDialog}
                  variant="outline"
                  className="h-8 px-3 text-sm rounded border-neutral-300 hover:bg-neutral-50"
                >
                  ✏️ Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-elevation-64 border border-neutral-200">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-xl font-semibold text-neutral-900">Edit Event</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleUpdateEvent} className="p-6 pt-4 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-title" className="text-sm font-medium text-neutral-900">Title *</Label>
                      <Input
                        id="edit-event-title"
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        required
                        disabled={editLoading}
                        className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-type" className="text-sm font-medium text-neutral-900">Type *</Label>
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
                    <Label htmlFor="edit-event-description" className="text-sm font-medium text-neutral-900">Description</Label>
                    <textarea
                      id="edit-event-description"
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter event description"
                      rows={3}
                      className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-none text-sm"
                      disabled={editLoading}
                      aria-label="Event description"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-status" className="text-sm font-medium text-neutral-900">Status *</Label>
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
                      <Label className="text-sm font-medium text-neutral-900">Start Date & Time *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="edit-event-start-date" className="text-xs text-neutral-600">Date</Label>
                          <Input
                            id="edit-event-start-date"
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
                            disabled={editLoading}
                            className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-event-start-time" className="text-xs text-neutral-600">Time</Label>
                          <Input
                            id="edit-event-start-time"
                            type="time"
                            value={eventFormData.startDate ? eventFormData.startDate.split('T')[1] || '09:00' : '09:00'}
                            onChange={(e) => {
                              const date = eventFormData.startDate ? eventFormData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                              setEventFormData(prev => ({ 
                                ...prev, 
                                startDate: `${date}T${e.target.value}`
                              }));
                            }}
                            disabled={editLoading}
                            className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-900">End Date & Time (Optional)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="edit-event-end-date" className="text-xs text-neutral-600">Date</Label>
                          <Input
                            id="edit-event-end-date"
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
                            disabled={editLoading}
                            className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-event-end-time" className="text-xs text-neutral-600">Time</Label>
                          <Input
                            id="edit-event-end-time"
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
                            disabled={editLoading || !eventFormData.endDate}
                            className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="edit-clear-end-date"
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
                          disabled={editLoading}
                          title="Toggle one-time event (no end date)"
                        />
                        <Label htmlFor="edit-clear-end-date" className="text-xs text-neutral-600 cursor-pointer">
                          One-time event (no end date)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-estimated-hours" className="text-sm font-medium text-neutral-900">Estimated Hours</Label>
                      <Input
                        id="edit-event-estimated-hours"
                        type="number"
                        min="0"
                        step="0.1"
                        value={eventFormData.estimatedHours}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                        placeholder="Enter estimated hours"
                        disabled={editLoading}
                        className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-actual-hours" className="text-sm font-medium text-neutral-900">Actual Hours</Label>
                      <Input
                        id="edit-event-actual-hours"
                        type="number"
                        min="0"
                        step="0.1"
                        value={eventFormData.actualHours}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, actualHours: e.target.value }))}
                        placeholder="Enter actual hours"
                        disabled={editLoading}
                        className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-900">Participants</Label>
                    <div className="max-h-32 overflow-y-auto border border-neutral-300 rounded p-3 space-y-2 bg-neutral-50">
                      {participants.map(user => (
                        <div key={user._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-event-participant-${user._id}`}
                            checked={eventFormData.participants.indexOf(user._id) !== -1}
                            onChange={() => handleParticipantToggle(user._id)}
                            className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600"
                            disabled={editLoading}
                            aria-labelledby={`edit-event-participant-label-${user._id}`}
                            title={`Select ${user.name} as participant`}
                          />
                          <Label 
                            htmlFor={`edit-event-participant-${user._id}`} 
                            id={`edit-event-participant-label-${user._id}`}
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
                            disabled={editLoading}
                            aria-label={`Reference link ${index + 1} title`}
                            className="rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => handleReferenceLinkChange(index, 'url', e.target.value)}
                            disabled={editLoading}
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
                              disabled={editLoading}
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
                      disabled={editLoading}
                      className="rounded border-neutral-300 hover:bg-neutral-50 h-8 text-sm"
                    >
                      + Add Link
                    </Button>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                      disabled={editLoading}
                      className="rounded px-4 py-1.5 h-8 text-sm border-neutral-300 hover:bg-neutral-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={editLoading || !eventFormData.title.trim() || !eventFormData.startDate}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium px-4 py-1.5 h-8 text-sm"
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Start Date</span>
            <div className="font-medium">{formatDateTime(event.startDate)}</div>
          </div>
          
          {event.endDate && (
            <div className="space-y-1">
              <span className="text-muted-foreground">End Date</span>
              <div className="font-medium">{formatDateTime(event.endDate)}</div>
            </div>
          )}
          
          {(event.estimatedHours ?? 0) > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Estimated Hours</span>
              <div className="font-medium">{event.estimatedHours}h</div>
            </div>
          )}
          
          {(event.actualHours ?? 0) > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Actual Hours</span>
              <div className="font-medium">{event.actualHours}h</div>
            </div>
          )}
        </div>

        {event.participants && event.participants.length > 0 && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Participants</span>
            <div className="flex flex-wrap gap-2">
              {event.participants.map(participantId => {
                const participant = participants.find(p => p._id === participantId);
                return participant ? (
                  <Badge 
                    key={participantId}
                    variant="secondary"
                    className="text-xs"
                  >
                    {participant.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {eventCost > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground text-sm">Estimated Cost</span>
            <div className="font-semibold text-lg text-green-600">{formatCurrency(eventCost)}</div>
          </div>
        )}

        {event.referenceLinks && event.referenceLinks.length > 0 && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Reference Links</span>
            <div className="flex flex-wrap gap-2">
              {event.referenceLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Badge 
                    variant="outline" 
                    className="hover:bg-accent cursor-pointer transition-colors"
                  >
                    <span className="mr-1">{getReferenceTypeIcon(link.type)}</span>
                    <span>{link.title || link.type}</span>
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;