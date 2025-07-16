// File: src/app/api/user/quiz-history/[userId]/route.ts
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

import User from '@/models/User';
import Participation from '@/models/Participation';
import Question from '@/models/Question';
import ParticipantAnswer from '@/models/ParticipantAnswer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await connectDB();

    // Extract userId from URL
    const { pathname } = new URL(req.url);
    const segments = pathname.split('/');
    const userId = segments[segments.indexOf('quiz-history') + 1];

    try {
        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
            });
        }
        if (!Types.ObjectId.isValid(userId)) {
            return new Response(JSON.stringify({ error: 'Invalid User ID' }), {
                status: 400,
            });
        }

        // Fetch user
        const user = await User.findById(userId)
            .select('_id username email')
            .lean<{ _id: Types.ObjectId; username: string; email: string }>();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
            });
        }

        // Get participations
        const participations = await Participation.find({ userId })
            .sort({ joinedAt: -1 })
            .populate({
                path: 'quizRoomId',
                populate: {
                    path: 'quizId',
                    model: 'Quiz',
                    select: 'title description duration creatorId createdAt',
                },
            })
            .lean<{
                _id: Types.ObjectId;
                quizRoomId: {
                    _id: Types.ObjectId;
                    quizId: {
                        _id: Types.ObjectId;
                        title: string;
                        description: string;
                        duration: number;
                        creatorId: Types.ObjectId;
                        createdAt: Date;
                    };
                };
                score: number;
                completed: boolean;
                joinedAt: Date;
                finishedAt: Date | null;
            }[]>();

        const partIds = participations.map(p => p._id);
        const quizIds = participations.map(p => p.quizRoomId.quizId._id);

        // Get answers + questions
        const [answers, questions] = await Promise.all([
            ParticipantAnswer.find({ participationId: { $in: partIds } })
                .select('participationId isCorrect marks')
                .lean<{ participationId: Types.ObjectId; isCorrect: boolean; marks: number }[]>(),
            Question.find({ quizId: { $in: quizIds } })
                .select('quizId marks')
                .lean<{ quizId: Types.ObjectId; marks: number }[]>(),
        ]);

        const ansByPart = new Map<string, typeof answers>();
        answers.forEach(a => {
            const k = a.participationId.toString();
            if (!ansByPart.has(k)) ansByPart.set(k, []);
            ansByPart.get(k)!.push(a);
        });

        const quesByQuiz = new Map<string, typeof questions>();
        questions.forEach(q => {
            const k = q.quizId.toString();
            if (!quesByQuiz.has(k)) quesByQuiz.set(k, []);
            quesByQuiz.get(k)!.push(q);
        });

        const quizHistory = participations.map(p => {
            const quizDoc = p.quizRoomId.quizId;
            const quizIdStr = quizDoc._id.toString();
            const questions = quesByQuiz.get(quizIdStr) || [];

            const answers = ansByPart.get(p._id.toString()) || [];
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            const answeredQuestions = answers.length;
            const accuracy = answeredQuestions
                ? Math.round((correctAnswers / answeredQuestions) * 100)
                : 0;
            const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);

            const completionTime =
                p.finishedAt && p.joinedAt
                    ? Math.round((p.finishedAt.getTime() - p.joinedAt.getTime()) / 60000)
                    : null;

            return {
                id: p._id.toString(),
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                    createdBy: quizDoc.creatorId.toString(),
                    createdAt: quizDoc.createdAt,
                },
                roomId: p.quizRoomId._id.toString(),
                score: p.score,
                correctAnswers,
                totalQuestions: questions.length,
                answeredQuestions,
                accuracy,
                totalPossibleMarks,
                completionTime,
                completed: p.completed,
                joinedAt: p.joinedAt,
                finishedAt: p.finishedAt,
                status: p.completed ? 'completed' : 'incomplete',
            };
        });

        const completedQuizzes = quizHistory.filter(q => q.completed);
        const totalScore = completedQuizzes.reduce((s, q) => s + q.score, 0);
        const totalCorrectAnswers = completedQuizzes.reduce((s, q) => s + q.correctAnswers, 0);
        const totalAttempted = completedQuizzes.reduce((s, q) => s + q.answeredQuestions, 0);

        const userStats = {
            totalQuizzes: participations.length,
            completedQuizzes: completedQuizzes.length,
            incompleteQuizzes: participations.length - completedQuizzes.length,
            totalScore,
            averageScore: completedQuizzes.length ? Math.round(totalScore / completedQuizzes.length) : 0,
            overallAccuracy: totalAttempted ? Math.round((totalCorrectAnswers / totalAttempted) * 100) : 0,
            totalCorrectAnswers,
            totalQuestionsAttempted: totalAttempted,
        };

        return new Response(
            JSON.stringify({
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                },
                quizHistory,
                userStats,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error('Error fetching quiz history:', err);
        return new Response(JSON.stringify({ error: 'Failed to fetch quiz history' }), {
            status: 500,
        });
    }
}
