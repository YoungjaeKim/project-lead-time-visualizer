import React from 'react';
import { Project } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '../utils/costUtils';
import ActivityGrid from './ActivityGrid';

interface ProjectRowProps {
  project: Project;
  onClick: (project: Project) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project, onClick }) => {
  const actualCost = calculateProjectCost(project);
  const budgetUsage = project.budget ? calculateBudgetUsage(actualCost, project.budget) : 0;
  const budgetStatus = getBudgetStatus(budgetUsage);
  
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

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : new Date();
  
  const adjustedStartDate = new Date();
  adjustedStartDate.setDate(adjustedStartDate.getDate() - 48);

  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={() => onClick(project)}
    >
      <div className="mb-3">
        <ActivityGrid 
          events={project.events || []} 
          startDate={adjustedStartDate}
          endDate={new Date()}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        {project.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
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
            <span className="text-gray-500">Events:</span>
            <div className="font-medium">{project.events?.length || 0}</div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Actual Cost:</span>
              <div className="font-medium">{formatCurrency(actualCost)}</div>
            </div>
            
            {project.budget && (
              <div>
                <span className="text-gray-500">Budget Usage:</span>
                <div className={`font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                  {budgetUsage.toFixed(1)}% of {formatCurrency(project.budget)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRow;