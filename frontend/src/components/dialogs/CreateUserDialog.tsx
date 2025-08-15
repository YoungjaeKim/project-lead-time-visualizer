import React from 'react';
import { Organization } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  dailyFee: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | '';
  mainOrganization: string;
  skills: string[];
}

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  organizations: Organization[];
  organizationsLoading: boolean;
  isLoading: boolean;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: '',
  dailyFee: '',
  level: '' as any,
  mainOrganization: '',
  skills: ['']
};

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || 
        !formData.role.trim() || !formData.dailyFee || !formData.level || !formData.mainOrganization) {
      return;
    }

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

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    updateField('skills', newSkills);
  };

  const addSkillField = () => {
    updateField('skills', [...formData.skills, '']);
  };

  const removeSkillField = (index: number) => {
    if (formData.skills.length > 1) {
      const newSkills = formData.skills.filter((_, i) => i !== index);
      updateField('skills', newSkills);
    }
  };

  const isSubmitDisabled = isLoading || !formData.name.trim() || !formData.email.trim() || 
    !formData.password.trim() || !formData.role.trim() || !formData.dailyFee || 
    !formData.level || !formData.mainOrganization;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.contentLarge}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.title}>
            Create New User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-name" className={STYLE_CONSTANTS.form.label}>
                Name *
              </Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter user name"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-email" className={STYLE_CONSTANTS.form.label}>
                Email *
              </Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter email address"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="user-password" className={STYLE_CONSTANTS.form.label}>
              Password *
            </Label>
            <Input
              id="user-password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Enter password"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-role" className={STYLE_CONSTANTS.form.label}>
                Role *
              </Label>
              <Input
                id="user-role"
                value={formData.role}
                onChange={(e) => updateField('role', e.target.value)}
                placeholder="Enter role (e.g., Developer, Designer)"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-daily-fee" className={STYLE_CONSTANTS.form.label}>
                Daily Fee *
              </Label>
              <Input
                id="user-daily-fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.dailyFee}
                onChange={(e) => updateField('dailyFee', e.target.value)}
                placeholder="Enter daily fee"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-level" className={STYLE_CONSTANTS.form.label}>
                Level *
              </Label>
              <Select 
                value={formData.level} 
                onValueChange={(value: any) => updateField('level', value)}
                required
                disabled={isLoading}
              >
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Principal">Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="user-organization" className={STYLE_CONSTANTS.form.label}>
                Main Organization *
              </Label>
              {organizationsLoading ? (
                <div className="text-sm text-neutral-500 py-2">Loading organizations...</div>
              ) : (
                <Select 
                  value={formData.mainOrganization} 
                  onValueChange={(value) => updateField('mainOrganization', value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                    <SelectValue placeholder="Select organization" />
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
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label className={STYLE_CONSTANTS.form.label}>Skills</Label>
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  placeholder="Enter skill"
                  disabled={isLoading}
                  className={STYLE_CONSTANTS.form.input}
                />
                {formData.skills.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkillField(index)}
                    disabled={isLoading}
                    className="h-8 w-8 rounded hover:bg-red-50 hover:text-red-600 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSkillField}
              disabled={isLoading}
              className={STYLE_CONSTANTS.button.outline}
            >
              + Add Skill
            </Button>
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
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
