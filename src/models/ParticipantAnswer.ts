import mongoose from 'mongoose';

const participantAnswerSchema = new mongoose.Schema(
    {
        participationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participation',
            required: true,
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },
        selectedOption: { type: String, required: true },   // "A" | "B" | "C" | "D"
        isCorrect: { type: Boolean, required: true },
        marks: { type: Number, required: true },
        answeredAt: { type: Date, default: Date.now },
    },
    { timestamps: false }  // add createdAt/updatedAt if you like
);

/* ---------------- unique composite index ---------------- */
participantAnswerSchema.index(
    { participationId: 1, questionId: 1 },
    { unique: true }
);

/* ---------------- virtual id (string) ---------------- */
participantAnswerSchema.virtual('id').get(function () {
    return this._id.toString();
});

/* ---------------- JSON / Object output ---------------- */
participantAnswerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, any>) {
        delete ret._id;  // keep only `id`
    },
});

export default
    mongoose.models.ParticipantAnswer ||
    mongoose.model('ParticipantAnswer', participantAnswerSchema);
