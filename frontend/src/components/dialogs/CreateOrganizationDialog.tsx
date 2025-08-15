import React from 'react';
import { Organization } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface OrganizationFormData {
  name: string;
  description: string;
  parentOrganization: string;
}

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  organizations: Organization[];
  organizationsLoading: boolean;
  isLoading: boolean;
}

const initialFormData: OrganizationFormData = {
  name: '',
  description: '',
  parentOrganization: ''
};

export const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  organizations,
  organizationsLoading,
  isLoading,
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

  const isSubmitDisabled = isLoading || !formData.name.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.content}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Create New Organization
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="organization-name" className={STYLE_CONSTANTS.form.label}>
              Organization Name *
            </Label>
            <Input
              id="organization-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter organization name"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>
          
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="organization-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="organization-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter organization description"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="organization-parent" className={STYLE_CONSTANTS.form.label}>
              Parent Organization
            </Label>
            {organizationsLoading ? (
              <div className="text-sm text-neutral-500 py-2">Loading organizations...</div>
            ) : (
              <Select 
                value={formData.parentOrganization} 
                onValueChange={(value) => updateField('parentOrganization', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue placeholder="Select parent organization" />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  {organizations.map(org => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
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
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
