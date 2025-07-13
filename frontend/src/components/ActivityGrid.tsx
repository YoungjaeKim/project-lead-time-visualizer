import React from 'react';
import { Event } from '../types';
import { generateDateRange, getActivityLevel } from '../utils/dateUtils';

interface ActivityGridProps {
  events: Event[];
  startDate: Date;
  endDate: Date;
}

const ActivityGrid: React.FC<ActivityGridProps> = ({ events, startDate, endDate }) => {
  const dateRange = generateDateRange(startDate, endDate).slice(0, 49);
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getActivityLevelForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return getActivityLevel(dayEvents.length);
  };

  const getColorClass = (level: string) => {
    switch (level) {
      case 'none': return 'bg-gray-100';
      case 'low': return 'bg-green-200';
      case 'medium': return 'bg-green-400';
      case 'high': return 'bg-green-600';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dateRange.map((date, index) => {
          const level = getActivityLevelForDate(date);
          const eventsCount = getEventsForDate(date).length;
          
          return (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm ${getColorClass(level)} cursor-pointer`}
              title={`${date.toDateString()}: ${eventsCount} events`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityGrid;