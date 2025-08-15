import React, { useEffect } from 'react';
import { Project } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface EditProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  budget: string;
  estimatedCost: string;
}

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditProjectFormData) => Promise<void>;
  project: Project | null;
  isLoading: boolean;
}

const initialFormData: EditProjectFormData = {
  name: '',
  description: '',
  status: 'planning',
  startDate: '',
  endDate: '',
  budget: '',
  estimatedCost: ''
};

export const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  project,
  isLoading,
}) => {
  const { formData, setData, reset } = useFormData(initialFormData);

  // Update form data when project changes
  useEffect(() => {
    if (project && isOpen) {
      const startDateStr = project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '';
      const endDateStr = project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '';
      
      setData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        startDate: startDateStr,
        endDate: endDateStr,
        budget: project.budget != null ? String(project.budget) : '',
        estimatedCost: project.estimatedCost != null ? String(project.estimatedCost) : ''
      });
    }
  }, [project, isOpen, setData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate) return;

    try {
      await onSubmit(formData);
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
      <DialogContent className={STYLE_CONSTANTS.dialog.contentMedium}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.titleLarge}>
            Edit Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-name" className={STYLE_CONSTANTS.form.label}>
                Name *
              </Label>
              <Input
                id="project-name"
                value={formData.name}
                onChange={(e) => setData({ name: e.target.value })}
                placeholder="Project name"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>

            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-status" className={STYLE_CONSTANTS.form.label}>
                Status *
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setData({ status: value })}
              >
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="project-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setData({ description: e.target.value })}
              placeholder="Describe the project"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-start-date" className={STYLE_CONSTANTS.form.label}>
                Start Date *
              </Label>
              <Input
                id="project-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setData({ startDate: e.target.value })}
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>

            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="project-end-date" className={STYLE_CONSTANTS.form.label}>
                End Date (Optional)
              </Label>
              <Input
                id="project-end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setData({ endDate: e.target.value })}
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clear-project-end-date"
                  checked={!formData.endDate}
                  onChange={(e) => setData({ endDate: e.target.checked ? '' : formData.startDate })}
                  className={STYLE_CONSTANTS.form.checkbox}
                  disabled={isLoading}
                  title="No end date yet"
                />
                <Label htmlFor="clear-project-end-date" className="text-xs text-neutral-600 cursor-pointer">
                  No end date yet
                </Label>
              </div>
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
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
                onChange={(e) => setData({ budget: e.target.value })}
                placeholder="Enter budget"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
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
                onChange={(e) => setData({ estimatedCost: e.target.value })}
                placeholder="Enter estimated cost"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
