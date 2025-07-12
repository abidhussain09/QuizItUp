import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    text: { type: String, required: true },
    imageUrl: { type: String },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctOption: { type: String, required: true },
    marks: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Question || mongoose.model('Question', questionSchema);
