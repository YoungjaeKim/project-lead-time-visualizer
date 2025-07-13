import mongoose, { Schema, Document } from 'mongoose';
import { IEvent } from '../types';

export interface IEventDocument extends IEvent, Document {}

const EventSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['duration', 'one-time']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['done', 'ongoing', 'notyet'],
    default: 'notyet'
  },
  referenceLinks: [{
    type: {
      type: String,
      required: true,
      enum: ['jira', 'github', 'confluence', 'other']
    },
    url: {
      type: String,
      required: true
    },
    title: {
      type: String
    }
  }],
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

EventSchema.index({ projectId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ startDate: 1 });

export default mongoose.model<IEventDocument>('Event', EventSchema);