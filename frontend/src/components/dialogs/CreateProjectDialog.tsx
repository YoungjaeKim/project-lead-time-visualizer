import React from 'react';
import { User } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  // Note: Participants are now managed separately via participant groups after project creation
  budget: string;
  estimatedCost: string;
}

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  users: User[]; // Kept for backward compatibility, may be removed
  usersLoading: boolean; // Kept for backward compatibility, may be removed
  isLoading: boolean;
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  status: 'planning',
  startDate: '',
  endDate: '',
  budget: '',
  estimatedCost: ''
};

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  users,
  usersLoading,
  isLoading,
}) => {
  const { formData, updateField, reset } = useFormData(initialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate) return;

    try {
      await onSubmit(formData);
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is managed by the parent component
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };


  const isSubmitDisabled = isLoading || !formData.name.trim() || !formData.startDate;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.contentLarge}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Create New Project
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="project-name" className={STYLE_CONSTANTS.form.label}>
              Project Name *
            </Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter project name"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>
          
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="project-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
              aria-label="Project description"
            />
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-status" className={STYLE_CONSTANTS.form.label}>
                Status *
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => updateField('status', value)}
                required
                disabled={isLoading}
              >
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-start-date" className={STYLE_CONSTANTS.form.label}>
                Start Date *
              </Label>
              <Input
                id="project-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-end-date" className={STYLE_CONSTANTS.form.label}>
                End Date
              </Label>
              <Input
                id="project-end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-budget" className={STYLE_CONSTANTS.form.label}>
                Budget
              </Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="Enter budget"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="project-estimated-cost" className={STYLE_CONSTANTS.form.label}>
              Estimated Cost
            </Label>
            <Input
              id="project-estimated-cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedCost}
              onChange={(e) => updateField('estimatedCost', e.target.value)}
              placeholder="Enter estimated cost"
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Note:</strong> Team members are now organized into participant groups. 
              After creating the project, you can add participant groups and assign members with specific roles.
            </div>
          </div>
          
          <div className={STYLE_CONSTANTS.dialog.footer}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className={STYLE_CONSTANTS.button.outline}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
