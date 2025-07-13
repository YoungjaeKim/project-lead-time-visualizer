import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project as ProjectType, Event, User } from '../types';
import { projectApi, eventApi, userApi } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '../utils/costUtils';
import EventCard from '../components/EventCard';
import ActivityGrid from '../components/ActivityGrid';

const Project: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProjectType | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'done' | 'ongoing' | 'notyet'>('all');

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

  const getFilteredEvents = () => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.status === eventFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error || 'Project not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
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
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 text-lg">{project.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Activity Overview</h3>
              <ActivityGrid 
                events={events} 
                startDate={adjustedStartDate}
                endDate={new Date()}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Events</h3>
                
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value as 'all' | 'done' | 'ongoing' | 'notyet')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Events ({events.length})</option>
                  <option value="notyet">Not Yet ({events.filter(e => e.status === 'notyet').length})</option>
                  <option value="ongoing">Ongoing ({events.filter(e => e.status === 'ongoing').length})</option>
                  <option value="done">Done ({events.filter(e => e.status === 'done').length})</option>
                </select>
              </div>
              
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
                    <div className="text-gray-400 text-lg mb-2">No events found</div>
                    <p className="text-gray-600">
                      {eventFilter === 'all' 
                        ? 'This project doesn\'t have any events yet.'
                        : `No events with status "${eventFilter}" found.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <div className="font-medium">{formatDate(project.startDate)}</div>
                </div>
                
                {project.endDate && (
                  <div>
                    <span className="text-gray-500">End Date:</span>
                    <div className="font-medium">{formatDate(project.endDate)}</div>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-500">Participants:</span>
                  <div className="font-medium">{project.participants?.length || 0}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Total Events:</span>
                  <div className="font-medium">{events.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Actual Cost:</span>
                  <div className="font-medium text-lg">{formatCurrency(actualCost)}</div>
                </div>
                
                {project.estimatedCost && (
                  <div>
                    <span className="text-gray-500">Estimated Cost:</span>
                    <div className="font-medium">{formatCurrency(project.estimatedCost)}</div>
                  </div>
                )}
                
                {project.budget && (
                  <>
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <div className="font-medium">{formatCurrency(project.budget)}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Budget Usage:</span>
                      <div className={`font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                        {budgetUsage.toFixed(1)}%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {project.participants && project.participants.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                
                <div className="space-y-3">
                  {project.participants.map(participant => (
                    <div key={participant._id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-gray-500">{participant.role}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">{participant.level}</div>
                        <div className="font-medium">{formatCurrency(participant.dailyFee)}/day</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;