import React from 'react';
import { Project } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, calculateProjectCost, calculateBudgetUsage, getBudgetStatus } from '../utils/costUtils';
import ActivityGrid from './ActivityGrid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectRowProps {
  project: Project;
  onClick: (project: Project) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project, onClick }) => {
  const actualCost = calculateProjectCost(project);
  const budgetUsage = project.budget ? calculateBudgetUsage(actualCost, project.budget) : 0;
  const budgetStatus = getBudgetStatus(budgetUsage);
  
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

  const stopPropagationForInteractiveElements = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, button, select, textarea, [role="button"]')) {
      event.stopPropagation();
    }
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={() => onClick(project)}
    >
      <CardHeader className="pb-3">
        <div 
          className="mb-3"
          onClickCapture={stopPropagationForInteractiveElements}
          onPointerDownCapture={stopPropagationForInteractiveElements}
        >
          <ActivityGrid 
            events={project.events || []} 
            startDate={adjustedStartDate}
            endDate={new Date()}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none tracking-tight">{project.name}</h3>
          <Badge variant={getStatusVariant(project.status)} className="capitalize">
            {project.status}
          </Badge>
        </div>
        
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{project.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
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
            <span className="text-muted-foreground">Events</span>
            <div className="font-medium">{project.events?.length || 0}</div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Actual Cost</span>
              <div className="font-semibold text-lg">{formatCurrency(actualCost)}</div>
            </div>
            
            {project.budget && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Budget Usage</span>
                <div className={`font-medium ${getBudgetStatusColor(budgetStatus)}`}>
                  {budgetUsage.toFixed(1)}% of {formatCurrency(project.budget)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectRow;