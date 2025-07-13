import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization } from '../types';

export interface IOrganizationDocument extends IOrganization, Document {}

const OrganizationSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  childOrganizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  }],
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

OrganizationSchema.index({ parentOrganization: 1 });
OrganizationSchema.index({ name: 1 });

export default mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);