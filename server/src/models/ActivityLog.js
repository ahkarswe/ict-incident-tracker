import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    entityType: { type: String, enum: ['Incident', 'User', 'Auth', 'System'], default: 'System' },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    action: { type: String, required: true },
    field: { type: String, default: '' },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('ActivityLog', activityLogSchema);
