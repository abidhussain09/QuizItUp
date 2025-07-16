// src/app/api/leaderboard/[roomId]/route.ts
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

import QuizRoom from '@/models/QuizRoom';
import Question from '@/models/Question';
import Participation from '@/models/Participation';
import ParticipantAnswer from '@/models/ParticipantAnswer';

export const dynamic = 'force-dynamic'; // always server‑side

export async function GET(
    _req: Request,
    { params }: { params: { roomId: string } },
) {
    await connectDB();

    try {
        const { roomId } = params;

        /* ────────── validation ────────── */
        if (!roomId) {
            return new Response(JSON.stringify({ error: 'Room ID is required' }), {
                status: 400,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return new Response(JSON.stringify({ error: 'Invalid Room ID format' }), {
                status: 400,
            });
        }

        /* ────────── fetch room + quiz doc ────────── */
        const room = await QuizRoom.findById(roomId)
            .populate({ path: 'quizId', model: 'Quiz' })
            .exec();

        if (!room) {
            return new Response(JSON.stringify({ error: 'Room not found' }), {
                status: 404,
            });
        }

        const quizDoc = room.quizId as any;

        /* ────────── fetch questions for total marks ────────── */
        const questions = await Question.find({ quizId: quizDoc._id })
            .select('marks')
            .exec();
        const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);

        /* ────────── completed participations ────────── */
        const participations = await Participation.find({
            quizRoomId: roomId,
            completed: true,
        })
            .sort({ score: -1, finishedAt: 1 })
            .populate({ path: 'userId', select: 'username' })
            .exec();

        const participationIds = participations.map(p => p._id);

        /* ────────── fetch answers & group by participation ────────── */
        const answers = await ParticipantAnswer.find({
            participationId: { $in: participationIds },
        }).exec();

        const answersByPart: Record<string, typeof answers> = {};
        answers.forEach(a => {
            const k = (a.participationId as mongoose.Types.ObjectId).toString();
            if (!answersByPart[k]) answersByPart[k] = [];
            answersByPart[k].push(a);
        });

        /* ────────── build leaderboard ────────── */
        const leaderboard = participations.map((p, idx) => {
            const partAnswers = answersByPart[p._id.toString()] || [];
            const correctCount = partAnswers.filter(a => a.isCorrect).length;
            const answeredCount = partAnswers.length;
            const totalQuestions = questions.length;
            const accuracy =
                answeredCount > 0
                    ? Math.round((correctCount / answeredCount) * 100)
                    : 0;

            const completionTime =
                p.finishedAt && p.joinedAt
                    ? Math.round(
                        (p.finishedAt.getTime() - p.joinedAt.getTime()) / (1000 * 60),
                    )
                    : null;

            return {
                rank: idx + 1,
                participant: {
                    id: (p.userId as any)._id.toString(),
                    username: (p.userId as any).username,
                },
                score: p.score,
                correctAnswers: correctCount,
                totalQuestions,
                answeredQuestions: answeredCount,
                accuracy,
                completionTime,
                finishedAt: p.finishedAt,
                joinedAt: p.joinedAt,
            };
        });

        /* ────────── quiz‑level statistics ────────── */
        const averageScore =
            participations.length > 0
                ? Math.round(
                    participations.reduce((sum, p) => sum + p.score, 0) /
                    participations.length,
                )
                : 0;
        const highestScore = participations.length > 0 ? participations[0].score : 0;

        /* ────────── respond ────────── */
        return new Response(
            JSON.stringify({
                quiz: {
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                    totalQuestions: questions.length,
                    totalPossibleMarks,
                },
                statistics: {
                    totalParticipants: participations.length,
                    averageScore,
                    highestScore,
                },
                leaderboard,
            }),
            { status: 200 },
        );
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch leaderboard' }),
            { status: 500 },
        );
    }
}
