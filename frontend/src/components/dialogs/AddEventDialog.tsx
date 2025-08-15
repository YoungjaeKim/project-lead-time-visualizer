import React from 'react';
import { User } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface EventFormData {
  title: string;
  description: string;
  type: 'one-time' | 'duration';
  status: 'notyet' | 'ongoing' | 'done';
  startDate: string;
  endDate: string;
  estimatedHours: string;
  actualHours: string;
  participants: string[];
  referenceLinks: { title: string; url: string; type: 'jira' | 'github' | 'confluence' | 'other' }[];
}

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  users: User[];
  usersLoading: boolean;
  isLoading: boolean;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  type: 'one-time',
  status: 'notyet',
  startDate: '',
  endDate: '',
  estimatedHours: '',
  actualHours: '',
  participants: [],
  referenceLinks: [{ title: '', url: '', type: 'other' }]
};

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
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
    if (!formData.title.trim() || !formData.startDate) return;

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

  const handleParticipantToggle = (userId: string) => {
    const currentParticipants = formData.participants;
    const isSelected = currentParticipants.indexOf(userId) !== -1;
    const newParticipants = isSelected
      ? currentParticipants.filter(id => id !== userId)
      : [...currentParticipants, userId];
    
    updateField('participants', newParticipants);
  };

  const handleReferenceLinkChange = (index: number, field: 'title' | 'url' | 'type', value: string) => {
    const newLinks = [...formData.referenceLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateField('referenceLinks', newLinks);
  };

  const addReferenceLink = () => {
    updateField('referenceLinks', [...formData.referenceLinks, { title: '', url: '', type: 'other' }]);
  };

  const removeReferenceLink = (index: number) => {
    if (formData.referenceLinks.length > 1) {
      const newLinks = formData.referenceLinks.filter((_, i) => i !== index);
      updateField('referenceLinks', newLinks);
    }
  };

  const isSubmitDisabled = isLoading || !formData.title.trim() || !formData.startDate;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.contentLarge}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.titleLarge}>
            Create New Event
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.formLarge}>
          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="event-title" className={STYLE_CONSTANTS.form.label}>
                Title *
              </Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter event title"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="event-type" className={STYLE_CONSTANTS.form.label}>
                Type *
              </Label>
              <Select value={formData.type} onValueChange={(value: any) => updateField('type', value)}>
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="event-description" className={STYLE_CONSTANTS.form.label}>
              Description
            </Label>
            <textarea
              id="event-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter event description"
              rows={3}
              className={STYLE_CONSTANTS.form.textarea}
              disabled={isLoading}
              aria-label="Event description"
            />
          </div>

          <div className={STYLE_CONSTANTS.spacing.formSection}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="event-status" className={STYLE_CONSTANTS.form.label}>
                Status *
              </Label>
              <Select value={formData.status} onValueChange={(value: any) => updateField('status', value)}>
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="notyet">Not Yet</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Start Date and Time */}
            <div className={STYLE_CONSTANTS.form.field}>
              <Label className={STYLE_CONSTANTS.form.label}>Start Date & Time *</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="event-start-date" className={STYLE_CONSTANTS.typography.smallText}>Date</Label>
                  <Input
                    id="event-start-date"
                    type="date"
                    value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const time = formData.startDate ? formData.startDate.split('T')[1] || '09:00' : '09:00';
                      updateField('startDate', e.target.value ? `${e.target.value}T${time}` : '');
                    }}
                    required
                    disabled={isLoading}
                    className={STYLE_CONSTANTS.form.input}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-start-time" className={STYLE_CONSTANTS.typography.smallText}>Time</Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={formData.startDate ? formData.startDate.split('T')[1] || '09:00' : '09:00'}
                    onChange={(e) => {
                      const date = formData.startDate ? formData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                      updateField('startDate', `${date}T${e.target.value}`);
                    }}
                    disabled={isLoading}
                    className={STYLE_CONSTANTS.form.input}
                  />
                </div>
              </div>
            </div>
            
            {/* End Date and Time */}
            <div className={STYLE_CONSTANTS.form.field}>
              <Label className={STYLE_CONSTANTS.form.label}>End Date & Time (Optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="event-end-date" className={STYLE_CONSTANTS.typography.smallText}>Date</Label>
                  <Input
                    id="event-end-date"
                    type="date"
                    value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                    onChange={(e) => {
                      if (!e.target.value) {
                        updateField('endDate', '');
                        return;
                      }
                      const time = formData.endDate ? formData.endDate.split('T')[1] || '17:00' : '17:00';
                      updateField('endDate', `${e.target.value}T${time}`);
                    }}
                    disabled={isLoading}
                    className={STYLE_CONSTANTS.form.input}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-end-time" className={STYLE_CONSTANTS.typography.smallText}>Time</Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={formData.endDate ? formData.endDate.split('T')[1] || '17:00' : '17:00'}
                    onChange={(e) => {
                      const date = formData.endDate ? 
                        formData.endDate.split('T')[0] : 
                        (formData.startDate ? formData.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                      updateField('endDate', `${date}T${e.target.value}`);
                    }}
                    disabled={isLoading || !formData.endDate}
                    className={`${STYLE_CONSTANTS.form.input} disabled:bg-neutral-50 disabled:text-neutral-400`}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="clear-end-date"
                  checked={!formData.endDate}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateField('endDate', '');
                    } else {
                      const startDate = formData.startDate ? formData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                      updateField('endDate', `${startDate}T17:00`);
                    }
                  }}
                  className={STYLE_CONSTANTS.form.checkbox}
                  disabled={isLoading}
                  title="Toggle one-time event (no end date)"
                />
                <Label htmlFor="clear-end-date" className={`${STYLE_CONSTANTS.typography.smallText} cursor-pointer`}>
                  One-time event (no end date)
                </Label>
              </div>
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="event-estimated-hours" className={STYLE_CONSTANTS.form.label}>
                Estimated Hours
              </Label>
              <Input
                id="event-estimated-hours"
                type="number"
                min="0"
                step="0.1"
                value={formData.estimatedHours}
                onChange={(e) => updateField('estimatedHours', e.target.value)}
                placeholder="Enter estimated hours"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="event-actual-hours" className={STYLE_CONSTANTS.form.label}>
                Actual Hours
              </Label>
              <Input
                id="event-actual-hours"
                type="number"
                min="0"
                step="0.1"
                value={formData.actualHours}
                onChange={(e) => updateField('actualHours', e.target.value)}
                placeholder="Enter actual hours"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label className={STYLE_CONSTANTS.form.label}>Participants</Label>
            {usersLoading ? (
              <div className="text-sm text-neutral-500 py-2">Loading users...</div>
            ) : (
              <div className="max-h-32 overflow-y-auto border border-neutral-300 rounded p-3 space-y-2 bg-neutral-50">
                {users.map(user => (
                  <div key={user._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`event-participant-${user._id}`}
                      checked={formData.participants.indexOf(user._id) !== -1}
                      onChange={() => handleParticipantToggle(user._id)}
                      className={STYLE_CONSTANTS.form.checkbox}
                      disabled={isLoading}
                      aria-labelledby={`event-participant-label-${user._id}`}
                      title={`Select ${user.name} as participant`}
                    />
                    <Label 
                      htmlFor={`event-participant-${user._id}`} 
                      id={`event-participant-label-${user._id}`}
                      className={`${STYLE_CONSTANTS.typography.label} cursor-pointer`}
                    >
                      {user.name} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label className={STYLE_CONSTANTS.form.label}>Reference Links</Label>
            {formData.referenceLinks.map((link, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Input
                    placeholder="Link title"
                    value={link.title}
                    onChange={(e) => handleReferenceLinkChange(index, 'title', e.target.value)}
                    disabled={isLoading}
                    aria-label={`Reference link ${index + 1} title`}
                    className={STYLE_CONSTANTS.form.input}
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => handleReferenceLinkChange(index, 'url', e.target.value)}
                    disabled={isLoading}
                    aria-label={`Reference link ${index + 1} URL`}
                    className={STYLE_CONSTANTS.form.input}
                  />
                </div>
                <div className="col-span-3">
                  <Select value={link.type} onValueChange={(value: any) => handleReferenceLinkChange(index, 'type', value)}>
                    <SelectTrigger className={`${STYLE_CONSTANTS.form.select} border-neutral-300`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                      <SelectItem value="jira">Jira</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="confluence">Confluence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  {formData.referenceLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReferenceLink(index)}
                      disabled={isLoading}
                      className="h-8 w-8 rounded hover:bg-red-50 hover:text-red-600 p-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addReferenceLink}
              disabled={isLoading}
              className={STYLE_CONSTANTS.button.outline}
            >
              + Add Link
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
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
