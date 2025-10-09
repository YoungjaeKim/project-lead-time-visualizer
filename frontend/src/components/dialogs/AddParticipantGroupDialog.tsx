import React from 'react';
import { Participant } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ParticipantGroupFormData {
  name: string;
  description: string;
  parentParticipant: string;
}

interface AddParticipantGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ParticipantGroupFormData) => Promise<void>;
  existingGroups: Participant[];
  isLoading: boolean;
}

const initialFormData: ParticipantGroupFormData = {
  name: '',
  description: '',
  parentParticipant: ''
};

export const AddParticipantGroupDialog: React.FC<AddParticipantGroupDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  existingGroups,
  isLoading
}) => {
  const { formData, updateField, reset } = useFormData(initialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.content}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Add Participant Group
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="group-name" className={STYLE_CONSTANTS.form.label}>
              Group Name *
            </Label>
            <Input
              id="group-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Development Team, Planning Group"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="group-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="group-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the purpose of this group"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="parent-group" className={STYLE_CONSTANTS.form.label}>
              Parent Group (Optional)
            </Label>
            <Select 
              value={formData.parentParticipant || "none"} 
              onValueChange={(value) => updateField('parentParticipant', value === "none" ? "" : value)}
              disabled={isLoading}
            >
              <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                <SelectValue placeholder="None (Top-level group)" />
              </SelectTrigger>
              <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                <SelectItem value="none">None (Top-level group)</SelectItem>
                {existingGroups.map(group => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={isLoading || !formData.name.trim()}
              className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
            >
              {isLoading ? 'Adding...' : 'Add Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

