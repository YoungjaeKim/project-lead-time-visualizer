import React, { useEffect } from 'react';
import { ExternalSourceConfig } from '@/types';
import { STYLE_CONSTANTS } from '@/styles/constants';
import { useFormData } from '@/hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface EditExternalSourceFormData {
  name: string;
  type: 'jira' | 'github' | 'confluence';
  baseUrl: string;
  credentials: {
    username: string;
    token: string;
    apiKey: string;
  };
  syncFrequency: number;
  externalId: string;
  isActive: boolean;
}

interface EditExternalSourceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditExternalSourceFormData) => Promise<void>;
  externalSource: ExternalSourceConfig | null;
  projectId: string;
  isLoading: boolean;
}

const initialFormData: EditExternalSourceFormData = {
  name: '',
  type: 'jira',
  baseUrl: '',
  credentials: {
    username: '',
    token: '',
    apiKey: ''
  },
  syncFrequency: 24,
  externalId: '',
  isActive: true
};

export const EditExternalSourceDialog: React.FC<EditExternalSourceDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  externalSource,
  projectId,
  isLoading,
}) => {
  const { formData, setData, reset } = useFormData(initialFormData);

  // Update form data when external source changes
  useEffect(() => {
    if (externalSource && isOpen && projectId) {
      const projectMapping = externalSource.projectMappings.find(
        mapping => mapping.internalProjectId === projectId
      );
      
      setData({
        name: externalSource.name,
        type: externalSource.type,
        baseUrl: externalSource.baseUrl,
        credentials: {
          username: '',
          token: '',
          apiKey: ''
        },
        syncFrequency: externalSource.syncFrequency,
        externalId: projectMapping?.externalId || '',
        isActive: externalSource.isActive
      });
    }
  }, [externalSource, isOpen, projectId, setData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.baseUrl.trim() || 
        !formData.credentials.token.trim() || !formData.externalId.trim()) return;

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

  const isSubmitDisabled = isLoading || !formData.name.trim() || !formData.baseUrl.trim() || 
    !formData.credentials.token.trim() || !formData.externalId.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={STYLE_CONSTANTS.dialog.contentMedium}>
        <DialogHeader className={STYLE_CONSTANTS.dialog.header}>
          <DialogTitle className={STYLE_CONSTANTS.dialog.titleLarge}>
            Edit External Source
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className={STYLE_CONSTANTS.dialog.form}>
          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="edit-external-source-name" className={STYLE_CONSTANTS.form.label}>
                Name *
              </Label>
              <Input
                id="edit-external-source-name"
                value={formData.name}
                onChange={(e) => setData({ name: e.target.value })}
                placeholder="e.g., Main Jira Instance"
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="edit-external-source-type" className={STYLE_CONSTANTS.form.label}>
                Type *
              </Label>
              <Select value={formData.type} onValueChange={(value: any) => setData({ type: value })}>
                <SelectTrigger className={STYLE_CONSTANTS.form.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STYLE_CONSTANTS.form.selectContent}>
                  <SelectItem value="jira">Jira</SelectItem>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="confluence">Confluence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="edit-external-source-base-url" className={STYLE_CONSTANTS.form.label}>
              Base URL *
            </Label>
            <Input
              id="edit-external-source-base-url"
              value={formData.baseUrl}
              onChange={(e) => setData({ baseUrl: e.target.value })}
              placeholder="e.g., https://yourcompany.atlassian.net or https://api.github.com"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="edit-external-source-external-id" className={STYLE_CONSTANTS.form.label}>
              External Project ID *
            </Label>
            <Input
              id="edit-external-source-external-id"
              value={formData.externalId}
              onChange={(e) => setData({ externalId: e.target.value })}
              placeholder="e.g., PROJECT-KEY for Jira, owner/repo for GitHub"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.gridTwoCol}>
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="edit-external-source-username" className={STYLE_CONSTANTS.form.label}>
                Username/Email (Optional)
              </Label>
              <Input
                id="edit-external-source-username"
                value={formData.credentials.username}
                onChange={(e) => setData({ 
                  credentials: { ...formData.credentials, username: e.target.value }
                })}
                placeholder="Leave empty for token-only authentication"
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
            
            <div className={STYLE_CONSTANTS.form.field}>
              <Label htmlFor="edit-external-source-sync-frequency" className={STYLE_CONSTANTS.form.label}>
                Sync Frequency (hours) *
              </Label>
              <Input
                id="edit-external-source-sync-frequency"
                type="number"
                min="1"
                value={formData.syncFrequency}
                onChange={(e) => setData({ syncFrequency: parseInt(e.target.value) || 24 })}
                required
                disabled={isLoading}
                className={STYLE_CONSTANTS.form.input}
              />
            </div>
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="edit-external-source-token" className={STYLE_CONSTANTS.form.label}>
              Bearer Token *
            </Label>
            <Input
              id="edit-external-source-token"
              type="password"
              value={formData.credentials.token}
              onChange={(e) => setData({ 
                credentials: { ...formData.credentials, token: e.target.value }
              })}
              placeholder="Your Bearer token or personal access token"
              required
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className={STYLE_CONSTANTS.form.field}>
            <Label htmlFor="edit-external-source-api-key" className={STYLE_CONSTANTS.form.label}>
              Additional API Key
            </Label>
            <Input
              id="edit-external-source-api-key"
              type="password"
              value={formData.credentials.apiKey}
              onChange={(e) => setData({ 
                credentials: { ...formData.credentials, apiKey: e.target.value }
              })}
              placeholder="Optional additional API key"
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.input}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-external-source-active"
              checked={formData.isActive}
              onChange={(e) => setData({ isActive: e.target.checked })}
              disabled={isLoading}
              className={STYLE_CONSTANTS.form.checkbox}
              title="Enable external source for syncing"
            />
            <Label htmlFor="edit-external-source-active" className={`${STYLE_CONSTANTS.form.label} cursor-pointer`}>
              Enable external source
            </Label>
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
              {isLoading ? 'Updating...' : 'Update External Source'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
