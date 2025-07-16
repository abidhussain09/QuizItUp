import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username : { type: String, unique: true, required: true },
  email    : { type: String, unique: true, required: true },
  password : { type: String, required: true },
  role     : { type: String, enum: ['ADMIN', 'PARTICIPANT'], default: 'PARTICIPANT' },
  createdAt: { type: Date, default: Date.now },

  // relations
  quizzes       : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  participations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participation' }],
});

// virtual id
userSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON output
userSchema.set('toJSON', {
  virtuals  : true,
  versionKey: false,
  transform (_doc, ret: Record<string, any>) {
    delete ret._id;        // no TS error
  },
});

export default mongoose.models.User || mongoose.model('User', userSchema);
