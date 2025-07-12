import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizRoom', required: true },
    joinedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    finishedAt: { type: Date },
});

export default mongoose.models.Participation || mongoose.model('Participation', participationSchema);
