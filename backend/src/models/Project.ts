import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from '../types';

export interface IProjectDocument extends IProject, Document {}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  events: [{
    type: Schema.Types.ObjectId,
    ref: 'Event'
  }],
  budget: {
    type: Number,
    min: 0
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ startDate: 1 });
ProjectSchema.index({ name: 1 });

export default mongoose.model<IProjectDocument>('Project', ProjectSchema);