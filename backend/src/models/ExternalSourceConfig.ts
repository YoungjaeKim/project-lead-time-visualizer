import mongoose, { Schema, Document } from 'mongoose';
import { IExternalSourceConfig } from '../types';

export interface IExternalSourceConfigDocument extends IExternalSourceConfig, Document {}

const ExternalSourceConfigSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['jira', 'github', 'confluence']
  },
  baseUrl: {
    type: String,
    required: true,
    trim: true
  },
  credentials: {
    username: {
      type: String,
      trim: true
    },
    token: {
      type: String,
      required: true
    },
    apiKey: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date
  },
  syncFrequency: {
    type: Number,
    required: true,
    default: 24
  },
  projectMappings: [{
    externalId: {
      type: String,
      required: true
    },
    internalProjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    }
  }]
}, {
  timestamps: true
});

ExternalSourceConfigSchema.index({ type: 1 });
ExternalSourceConfigSchema.index({ isActive: 1 });

export default mongoose.model<IExternalSourceConfigDocument>('ExternalSourceConfig', ExternalSourceConfigSchema);