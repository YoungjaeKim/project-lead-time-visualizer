import React from 'react';
import { ExternalSourceConfig } from '@/types';
import { Button } from '@/components/ui/button';

interface ExternalSourceCardProps {
  source: ExternalSourceConfig;
  projectId?: string;
  onEdit: (source: ExternalSourceConfig) => void;
  onTestConnection: (id: string) => void;
  onTriggerSync: (id: string) => void;
  onDelete: (id: string) => void;
}

const getExternalSourceIcon = (type: string) => {
  switch (type) {
    case 'jira': return '🎯';
    case 'github': return '📚';
    case 'confluence': return '📖';
    default: return '🔗';
  }
};

const formatLastSync = (date?: Date) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleString();
};

export const ExternalSourceCard: React.FC<ExternalSourceCardProps> = ({
  source,
  projectId,
  onEdit,
  onTestConnection,
  onTriggerSync,
  onDelete,
}) => {
  const projectMapping = source.projectMappings.find(
    mapping => mapping.internalProjectId === projectId
  );

  return (
    <div key={source._id} className="p-3 bg-neutral-50 rounded border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-base">{getExternalSourceIcon(source.type)}</span>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="font-medium text-neutral-900 text-sm">{source.name}</div>
              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                source.isActive 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {source.isActive ? 'Active' : 'Disabled'}
              </div>
            </div>
            <div className="text-xs text-neutral-500 capitalize">{source.type}</div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(source)}
            className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
            title="Edit"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTestConnection(source._id)}
            className="h-6 w-6 p-0 hover:bg-green-100 text-green-600"
            title="Test Connection"
          >
            🔧
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTriggerSync(source._id)}
            className="h-6 w-6 p-0 hover:bg-orange-100 text-orange-600"
            title="Trigger Sync"
          >
            🔄
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(source._id)}
            className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
            title="Remove"
          >
            🗑️
          </Button>
        </div>
      </div>
      <div className="text-xs text-neutral-500 space-y-1">
        <div>External ID: <span className="font-mono">{projectMapping?.externalId}</span></div>
        <div>Last Sync: {formatLastSync(source.lastSyncAt)}</div>
        <div>Sync Every: {source.syncFrequency}h</div>
      </div>
    </div>
  );
};
