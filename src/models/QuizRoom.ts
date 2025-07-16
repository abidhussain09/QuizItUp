import mongoose from 'mongoose';

const quizRoomSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    inviteCode: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
    startTime: { type: Date },
    endTime: { type: Date },
});

// ✅ Virtual: Link QuizRoom → Participation[]
quizRoomSchema.virtual('participations', {
    ref: 'Participation',
    localField: '_id',
    foreignField: 'quizRoomId',
});

// ✅ Ensure virtuals appear in JSON and object outputs
quizRoomSchema.set('toObject', { virtuals: true });
quizRoomSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
        delete ret._id;
    },
});


export default mongoose.models.QuizRoom || mongoose.model('QuizRoom', quizRoomSchema);
