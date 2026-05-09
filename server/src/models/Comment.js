import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
