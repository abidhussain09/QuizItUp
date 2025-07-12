import mongoose from 'mongoose';

const quizRoomSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    inviteCode: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
    startTime: { type: Date },
    endTime: { type: Date },
});

export default mongoose.models.QuizRoom || mongoose.model('QuizRoom', quizRoomSchema);
