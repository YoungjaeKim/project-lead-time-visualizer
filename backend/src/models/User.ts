import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  dailyFee: {
    type: Number,
    required: true,
    min: 0
  },
  level: {
    type: String,
    required: true,
    enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
  },
  mainOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  subOrganizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  }]
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });
UserSchema.index({ mainOrganization: 1 });

export default mongoose.model<IUserDocument>('User', UserSchema);