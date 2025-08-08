import React, { useMemo, useState } from 'react';
import { Event } from '../types';
import { getActivityLevel } from '../utils/dateUtils';

interface ActivityGridProps {
  events: Event[];
  // These represent the project's own start/end period (for highlighting)
  startDate: Date;
  endDate?: Date;
}

const ActivityGrid: React.FC<ActivityGridProps> = ({ events, startDate, endDate }) => {
  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfWeek = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - day);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day)); // Saturday
    return d;
  };

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const projectStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const projectEnd = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    : normalizedToday;

  // Decide default window
  const defaultWindow = useMemo(() => {
    if (normalizedToday < projectStart) {
      // Project in future: show a year starting at project start
      const from = new Date(projectStart);
      const to = addDays(from, 364);
      return { from, to };
    }
    if (normalizedToday > projectEnd) {
      // Project ended: show the final year of the project
      const to = new Date(projectEnd);
      const from = addDays(to, -364);
      return { from, to };
    }
    // Today within project period: past year to today
    const to = new Date(normalizedToday);
    const from = addDays(to, -364);
    return { from, to };
  }, [normalizedToday.getTime(), projectStart.getTime(), projectEnd.getTime()]);

  const [fromDate, setFromDate] = useState<Date>(defaultWindow.from);
  const [toDate, setToDate] = useState<Date>(defaultWindow.to);

  const displayStart = startOfWeek(fromDate);
  const displayEnd = endOfWeek(toDate);

  const daysBetween = Math.floor(
    (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const totalWeeks = Math.ceil(daysBetween / 7);

  // Weeks columns, each with 7 days (Sun..Sat)
  const weeks: Date[][] = useMemo(
    () =>
      Array.from({ length: totalWeeks }, (_, w) => {
        const weekStart = addDays(displayStart, w * 7);
        return Array.from({ length: 7 }, (_, d) => addDays(weekStart, d));
      }),
    [displayStart.getTime(), totalWeeks]
  );

  const isInProjectPeriod = (date: Date) => date >= projectStart && date <= projectEnd;

  const getEventsForDate = (date: Date) =>
    events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });

  const getActivityLevelForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return getActivityLevel(dayEvents.length);
  };

  const getColorClass = (level: string, inProject: boolean) => {
    if (!inProject) {
      return 'bg-gray-100'; // lighter gray for non-project period
    }
    switch (level) {
      case 'none':
        return 'bg-gray-100';
      case 'low':
        return 'bg-green-200';
      case 'medium':
        return 'bg-green-400';
      case 'high':
        return 'bg-green-600';
      default:
        return 'bg-gray-100';
    }
  };

  const monthShort = (d: Date) => d.toLocaleString(undefined, { month: 'short' });
  const two = (n: number) => (n < 10 ? `0${n}` : String(n));
  const toInputValue = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

  const onFromChange = (value: string) => {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      if (d > toDate) {
        setToDate(d);
      }
      setFromDate(d);
    }
  };

  const onToChange = (value: string) => {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      if (d < fromDate) {
        setFromDate(d);
      }
      setToDate(d);
    }
  };

  return (
    <div className="inline-block">
      {/* Date selectors line (top) */}
      <div className="flex justify-end mb-2 text-xs text-gray-700 gap-2">
        <span>From</span>
        <input
          type="date"
          value={toInputValue(fromDate)}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-7 rounded border border-neutral-300 px-2"
        />
        <span>To</span>
        <input
          type="date"
          value={toInputValue(toDate)}
          onChange={(e) => onToChange(e.target.value)}
          className="h-7 rounded border border-neutral-300 px-2"
        />
      </div>

      {/* Month labels row */}
      <div className="flex items-center mb-2">
        <div className="w-8" />
        <div className="flex">
          {weeks.map((week, wIdx) => {
            const firstDay = week[0];
            const prevFirstDay = weeks[wIdx - 1]?.[0];
            const showLabel = wIdx === 0 || firstDay.getMonth() !== prevFirstDay.getMonth();
            return (
              <div key={`m-${wIdx}`} className="w-3 mr-1 text-[10px] text-gray-600">
                {showLabel ? monthShort(firstDay) : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="w-8 grid grid-rows-7 gap-1 text-[10px] text-gray-600 mr-1">
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div key={`dl-${dayIdx}`} className="h-3 flex items-center">
              {dayIdx === 1 ? 'Mon' : dayIdx === 3 ? 'Wed' : dayIdx === 5 ? 'Fri' : ''}
            </div>
          ))}
        </div>

        {/* Activity grid */}
        <div className="flex">
          {weeks.map((week, wIdx) => (
            <div key={`w-${wIdx}`} className="grid grid-rows-7 gap-1 mr-1">
              {week.map((date, dIdx) => {
                const level = getActivityLevelForDate(date);
                const eventsCount = getEventsForDate(date).length;
                const inProject = isInProjectPeriod(date);
                const isToday = date.toDateString() === normalizedToday.toDateString();
                return (
                  <div
                    key={`c-${wIdx}-${dIdx}`}
                    className={`w-3 h-3 rounded-sm ${getColorClass(level, inProject)} cursor-pointer border ${
                      isToday ? 'border-black' : 'border-transparent'
                    }`}
                    title={`${date.toDateString()}: ${eventsCount} events`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-200 rounded-sm" />
          <div className="w-3 h-3 bg-green-400 rounded-sm" />
          <div className="w-3 h-3 bg-green-600 rounded-sm" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityGrid;