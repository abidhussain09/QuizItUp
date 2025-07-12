import mongoose from 'mongoose';

const participantAnswerSchema = new mongoose.Schema({
    participationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    marks: { type: Number, required: true },
    answeredAt: { type: Date, default: Date.now },
});

participantAnswerSchema.index({ participationId: 1, questionId: 1 }, { unique: true });

export default mongoose.models.ParticipantAnswer || mongoose.model('ParticipantAnswer', participantAnswerSchema);
