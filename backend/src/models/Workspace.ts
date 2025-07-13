import mongoose, { Schema, Document } from 'mongoose';
import { IWorkspace } from '../types';

export interface IWorkspaceDocument extends IWorkspace, Document {}

const WorkspaceSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project'
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

WorkspaceSchema.index({ owner: 1 });
WorkspaceSchema.index({ name: 1 });

export default mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);