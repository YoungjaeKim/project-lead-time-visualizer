import React from 'react';
import { Event, User } from '../types';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency, calculateEventCost } from '../utils/costUtils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventCardProps {
  event: Event;
  participants: User[];
  onStatusChange: (eventId: string, status: 'done' | 'ongoing' | 'notyet') => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, participants, onStatusChange }) => {
  const eventCost = calculateEventCost(event, participants);
  
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
          
          {event.estimatedHours && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Estimated Hours</span>
              <div className="font-medium">{event.estimatedHours}h</div>
            </div>
          )}
          
          {event.actualHours && (
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