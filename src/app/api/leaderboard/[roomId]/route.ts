// src/app/api/leaderboard/[roomId]/route.ts
import { connectDB } from '@/lib/db';
import mongoose, { Types } from 'mongoose';

import '@/models/QuizRoom';
import '@/models/Question';
import '@/models/Participation';
import '@/models/ParticipantAnswer';

import QuizRoom from '@/models/QuizRoom';
import Question from '@/models/Question';
import Participation from '@/models/Participation';
import ParticipantAnswer from '@/models/ParticipantAnswer';

export const dynamic = 'force-dynamic'; // always server‑side

type ObjId = Types.ObjectId;

/* ---------- GET /api/leaderboard/[roomId] ---------- */
export async function GET(req: Request) {
    await connectDB();

    try {
        /* ── extract roomId from the pathname ── */
        const { pathname } = new URL(req.url);
        // pathname ends with ".../leaderboard/<roomId>"
        const roomId = pathname.split('/').pop()!;

        /* ── validation ── */
        if (!roomId)
            return new Response(JSON.stringify({ error: 'Room ID is required' }), { status: 400 });

        if (!mongoose.Types.ObjectId.isValid(roomId))
            return new Response(JSON.stringify({ error: 'Invalid Room ID format' }), { status: 400 });

        /* ── fetch room & its quiz ── */
        const room = await QuizRoom.findById(roomId)
            .populate<{ quizId: { _id: Types.ObjectId; title: string; description: string; duration: number } }>({
                path: 'quizId',
                model: 'Quiz',
            })
            .lean<{
                _id: Types.ObjectId;
                inviteCode: string;
                quizId: {
                    _id: Types.ObjectId;
                    title: string;
                    description: string;
                    duration: number;
                };
            }>();


        if (!room)
            return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });

        const quizDoc = room.quizId as {
            _id: ObjId;
            title: string;
            description: string;
            duration: number;
        };

        /* ── total marks & question count ── */
        const questions = await Question.find({ quizId: quizDoc._id })
            .select('marks')
            .lean<{ marks: number }[]>();

        const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);

        /* ── completed participations ── */
        const participations = await Participation.find({
            quizRoomId: roomId,
            completed: true,
        })
            .sort({ score: -1, finishedAt: 1 })
            .populate({ path: 'userId', select: 'username' })
            .lean<{
                _id: ObjId;
                userId: { _id: ObjId; username: string };
                joinedAt: Date;
                finishedAt: Date | null;
                score: number;
            }[]>();

        /* ── answers for accuracy ── */
        const partIds = participations.map(p => p._id);
        const answers = await ParticipantAnswer.find({
            participationId: { $in: partIds },
        }).lean<{ participationId: ObjId; isCorrect: boolean }[]>();

        const answersByPart = new Map<string, typeof answers>();
        answers.forEach(a => {
            const key = a.participationId.toString();
            if (!answersByPart.has(key)) answersByPart.set(key, []);
            answersByPart.get(key)!.push(a);
        });

        /* ── build leaderboard ── */
        const leaderboard = participations.map((p, idx) => {
            const a = answersByPart.get(p._id.toString()) ?? [];
            const correct = a.filter(ans => ans.isCorrect).length;
            const answered = a.length;
            const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

            const completionTime =
                p.finishedAt && p.joinedAt
                    ? Math.round((p.finishedAt.getTime() - p.joinedAt.getTime()) / 60000)
                    : null;

            return {
                rank: idx + 1,
                participant: {
                    id: p.userId._id.toString(),
                    username: p.userId.username,
                },
                score: p.score,
                correctAnswers: correct,
                totalQuestions: questions.length,
                answeredQuestions: answered,
                accuracy,
                completionTime,
                finishedAt: p.finishedAt,
                joinedAt: p.joinedAt,
            };
        });

        /* ── quiz‑level stats ── */
        const averageScore =
            participations.length > 0
                ? Math.round(participations.reduce((s, p) => s + p.score, 0) / participations.length)
                : 0;
        const highestScore = participations.length > 0 ? participations[0].score : 0;

        /* ── response ── */
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
        return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
            status: 500,
        });
    }
}
