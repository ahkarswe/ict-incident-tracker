import mongoose from 'mongoose';
import { calculateDowntimeMinutes } from '../utils/incident.js';

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    url: String,
    mimeType: String,
    label: { type: String, default: '' }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    incidentId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Network', 'Server', 'Cloud', 'Security', 'Database', 'Backup', 'Application', 'Power', 'ISP'],
      required: true
    },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Monitoring', 'Resolved', 'Closed'], default: 'Open' },
    impactLevel: { type: String, trim: true, default: 'Medium' },
    rootCause: { type: String, default: '' },
    resolutionSummary: { type: String, default: '' },
    reportBy: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
    slaDueTime: { type: Date, required: true, default: () => new Date(Date.now() + 4 * 60 * 60 * 1000) },
    downtimeDuration: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    attachments: [attachmentSchema],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    activityLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActivityLog' }],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

incidentSchema.pre('save', function keepDowntimeUpdated(next) {
  this.downtimeDuration = calculateDowntimeMinutes(this.startTime, this.endTime);
  next();
});

export default mongoose.model('Incident', incidentSchema);
