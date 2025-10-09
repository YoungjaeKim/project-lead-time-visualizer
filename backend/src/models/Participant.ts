import mongoose, { Schema, Document } from 'mongoose';
import { IParticipant } from '../types';

export interface IParticipantDocument extends IParticipant, Document {}

const ParticipantSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentParticipant: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    default: null
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roles: [{
      type: String,
      trim: true,
      required: true
    }]
  }]
}, {
  timestamps: true
});

// Indexes for performance
ParticipantSchema.index({ projectId: 1 });
ParticipantSchema.index({ parentParticipant: 1 });
ParticipantSchema.index({ name: 1 });

export default mongoose.model<IParticipantDocument>('Participant', ParticipantSchema);

