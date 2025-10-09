import React, { useState } from 'react';
import { User } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

export interface MemberFormData {
  userId: string;
  roles: string[];
}

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  availableUsers: User[];
  existingMemberIds: string[];
  isLoading: boolean;
  groupName: string;
}

const initialFormData: MemberFormData = {
  userId: '',
  roles: []
};

const commonRoles = [
  'Project Manager',
  'Tech Lead',
  'Lead Developer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'QA Engineer',
  'DevOps Engineer',
  'Product Owner',
  'Scrum Master',
  'Business Analyst',
  'Architect'
];

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  availableUsers,
  existingMemberIds,
  isLoading,
  groupName
}) => {
  const { formData, updateField, reset } = useFormData(initialFormData);
  const [customRole, setCustomRole] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || formData.roles.length === 0) return;

    try {
      await onSubmit(formData);
      reset();
      setCustomRole('');
      onOpenChange(false);
    } catch (error) {
      // Error handling is managed by the parent component
    }
  };

  const handleClose = () => {
    reset();
    setCustomRole('');
    onOpenChange(false);
  };

  const handleAddRole = (role: string) => {
    if (role && !formData.roles.includes(role)) {
      updateField('roles', [...formData.roles, role]);
    }
  };

  const handleAddCustomRole = () => {
    if (customRole.trim() && !formData.roles.includes(customRole.trim())) {
      updateField('roles', [...formData.roles, customRole.trim()]);
      setCustomRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    updateField('roles', formData.roles.filter(role => role !== roleToRemove));
  };

  const availableUsersFiltered = availableUsers.filter(
    user => !existingMemberIds.includes(user._id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.content}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Add Member to {groupName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="user-select" className={STYLE_CONSTANTS.form.label}>
              Select User *
            </Label>
            <Select 
              value={formData.userId} 
              onValueChange={(value) => updateField('userId', value)}
              disabled={isLoading}
            >
              <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                {availableUsersFiltered.length === 0 ? (
                  <div className="p-2 text-sm text-neutral-500">No available users</div>
                ) : (
                  availableUsersFiltered.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email}) - {user.level}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label className={STYLE_CONSTANTS.form.label}>
              Project Roles * (Select or add custom)
            </Label>
            
            {/* Selected roles */}
            {formData.roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                {formData.roles.map(role => (
                  <div 
                    key={role}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="hover:bg-blue-200 rounded p-0.5"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Common roles select */}
            <Select 
              value="" 
              onValueChange={handleAddRole}
              disabled={isLoading}
            >
              <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                <SelectValue placeholder="Add a role..." />
              </SelectTrigger>
              <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                {commonRoles
                  .filter(role => !formData.roles.includes(role))
                  .map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            {/* Custom role input */}
            <div className="flex gap-2 mt-2">
              <Input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Or enter custom role..."
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRole();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddCustomRole}
                disabled={isLoading || !customRole.trim()}
                variant="outline"
                className="whitespace-nowrap"
              >
                Add
              </Button>
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
              disabled={isLoading || !formData.userId || formData.roles.length === 0}
              className={`${STYLE_CONSTANTS.button.primary} ${STYLE_CONSTANTS.button.sizes.sm}`}
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

