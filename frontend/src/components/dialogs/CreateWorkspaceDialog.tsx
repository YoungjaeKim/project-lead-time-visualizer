import React from 'react';
import { User } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface WorkspaceFormData {
  name: string;
  description: string;
  owner: string;
}

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  users: User[];
  usersLoading: boolean;
  isLoading: boolean;
}

const initialFormData: WorkspaceFormData = {
  name: '',
  description: '',
  owner: ''
};

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
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
    if (!formData.name.trim() || !formData.owner) return;

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

  const isSubmitDisabled = isLoading || !formData.name.trim() || !formData.owner;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.content}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Create New Workspace
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="workspace-name" className={STYLE_CONSTANTS.form.label}>
              Workspace Name *
            </Label>
            <Input
              id="workspace-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter workspace name"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>
          
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="workspace-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="workspace-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter workspace description"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
              aria-label="Workspace description"
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="workspace-owner" className={STYLE_CONSTANTS.form.label}>
              Owner *
            </Label>
            {usersLoading ? (
              <div className="text-sm text-neutral-500 py-2">Loading users...</div>
            ) : (
              <Select 
                value={formData.owner} 
                onValueChange={(value) => updateField('owner', value)}
                required
                disabled={isLoading}
              >
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  {users.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
