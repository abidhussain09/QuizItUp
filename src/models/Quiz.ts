import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        duration: {
            type: Number,
            default: 30, // in minutes
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

// ✅ Virtual field to expose `id` like Prisma
quizSchema.virtual('id').get(function () {
    return this._id.toString();
});

// ✅ Clean up JSON response: remove `_id` and `__v`, add `id`
quizSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, any>) {
        delete ret._id;
    },
});
// Add this to schema (not required unless you want virtual population)
quizSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'quizId',
});


export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
