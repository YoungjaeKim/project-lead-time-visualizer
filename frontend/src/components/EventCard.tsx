import React from 'react';
import { Event, User } from '../types';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency, calculateEventCost } from '../utils/costUtils';

interface EventCardProps {
  event: Event;
  participants: User[];
  onStatusChange: (eventId: string, status: 'done' | 'ongoing' | 'notyet') => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, participants, onStatusChange }) => {
  const eventCost = calculateEventCost(event, participants);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'notyet': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'duration': return 'bg-purple-100 text-purple-800';
      case 'one-time': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-gray-600 text-sm mb-2">{event.description}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
            {event.type}
          </span>
          
          <select
            value={event.status}
            onChange={(e) => onStatusChange(event._id, e.target.value as 'done' | 'ongoing' | 'notyet')}
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="notyet">Not Yet</option>
            <option value="ongoing">Ongoing</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-500">Start Date:</span>
          <div className="font-medium">{formatDateTime(event.startDate)}</div>
        </div>
        
        {event.endDate && (
          <div>
            <span className="text-gray-500">End Date:</span>
            <div className="font-medium">{formatDateTime(event.endDate)}</div>
          </div>
        )}
        
        {event.estimatedHours && (
          <div>
            <span className="text-gray-500">Estimated Hours:</span>
            <div className="font-medium">{event.estimatedHours}h</div>
          </div>
        )}
        
        {event.actualHours && (
          <div>
            <span className="text-gray-500">Actual Hours:</span>
            <div className="font-medium">{event.actualHours}h</div>
          </div>
        )}
      </div>

      {event.participants && event.participants.length > 0 && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">Participants:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {event.participants.map(participantId => {
              const participant = participants.find(p => p._id === participantId);
              return participant ? (
                <span 
                  key={participantId}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {participant.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {eventCost > 0 && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <span className="text-gray-500 text-sm">Estimated Cost:</span>
          <div className="font-medium text-green-600">{formatCurrency(eventCost)}</div>
        </div>
      )}

      {event.referenceLinks && event.referenceLinks.length > 0 && (
        <div>
          <span className="text-gray-500 text-sm">Reference Links:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {event.referenceLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded transition-colors"
              >
                <span>{getReferenceTypeIcon(link.type)}</span>
                <span>{link.title || link.type}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;