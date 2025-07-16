// app/api/admin/dashboard-stats/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

/* ── ensure models are registered ── */
import '@/models/User';
import '@/models/Quiz';
import '@/models/QuizRoom';
import '@/models/Participation';
import '@/models/ParticipantAnswer';

import User from '@/models/User';
import Quiz from '@/models/Quiz';
import QuizRoom from '@/models/QuizRoom';
import Participation from '@/models/Participation';
import ParticipantAnswer from '@/models/ParticipantAnswer';

export const dynamic = 'force-dynamic';

/* ---------- helper types ---------- */
type ObjId = Types.ObjectId;

interface PopUser { _id: ObjId; username: string }
interface PopQuiz { _id: ObjId; title: string }
interface PopQuizRoom { _id: ObjId; quizId: PopQuiz }
interface PopParticipation {
    _id: ObjId;
    userId: PopUser;
    quizRoomId: PopQuizRoom;
    joinedAt: Date;
    finishedAt: Date | null;
    score: number;
    completed: boolean;
}

export async function GET(req: NextRequest) {
    await connectDB();

    try {
        /* ── query‑param validation ── */
        const { searchParams } = new URL(req.url);
        const adminId = searchParams.get('adminId');

        if (!adminId)
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), { status: 400 });

        if (!Types.ObjectId.isValid(adminId))
            return new Response(JSON.stringify({ error: 'Invalid Admin ID' }), { status: 400 });

        /* ── verify admin ── */
        const admin = await User.findById(adminId)
            .select('role')
            .lean<{ _id: ObjId; role: string }>();

        if (!admin || admin.role !== 'ADMIN')
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });

        const adminObjId = new Types.ObjectId(adminId);

        /* ── quiz & room IDs for this admin ── */
        const quizIds = await Quiz.find({ creatorId: adminObjId })
            .select('_id')
            .lean<{ _id: ObjId }[]>()
            .then(qs => qs.map(q => q._id));

        const roomIds = await QuizRoom.find({ quizId: { $in: quizIds } })
            .select('_id')
            .lean<{ _id: ObjId }[]>()
            .then(rs => rs.map(r => r._id));

        /* ── counts ── */
        const [
            totalQuizzes,
            totalRooms,
            totalParticipations,
            completedParticipations,
            avgScoreAgg,
        ] = await Promise.all([
            quizIds.length,
            roomIds.length,
            Participation.countDocuments({ quizRoomId: { $in: roomIds } }),
            Participation.countDocuments({ completed: true, quizRoomId: { $in: roomIds } }),
            Participation.aggregate([
                { $match: { completed: true, quizRoomId: { $in: roomIds } } },
                { $group: { _id: null, avgScore: { $avg: '$score' } } },
            ]),
        ]);

        const averageScore =
            avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 0;
        const completionRate =
            totalParticipations > 0
                ? Math.round((completedParticipations / totalParticipations) * 100)
                : 0;

        /* ── top performers (10) ── */
        const topParts = (await Participation.find({
            completed: true,
            quizRoomId: { $in: roomIds },
        })
            .sort({ score: -1, finishedAt: 1 })
            .limit(10)
            .populate({ path: 'userId', select: 'username' })
            .populate({ path: 'quizRoomId', populate: { path: 'quizId', select: 'title' } })
            .lean()
            .exec()) as unknown as PopParticipation[];

        /* answers for accuracy */
        const topPartIds = topParts.map(p => p._id);
        const topAnswers = await ParticipantAnswer.find({ participationId: { $in: topPartIds } })
            .select('participationId isCorrect')
            .lean();

        const answersByPart = new Map<string, typeof topAnswers>();
        topAnswers.forEach(a => {
            const key = (a.participationId as ObjId).toString();
            if (!answersByPart.has(key)) answersByPart.set(key, []);
            answersByPart.get(key)!.push(a);
        });

        const formattedTop = topParts.map((p, idx) => {
            const ans = answersByPart.get(p._id.toString()) ?? [];
            const correct = ans.filter(a => a.isCorrect).length;
            const accuracy = ans.length ? Math.round((correct / ans.length) * 100) : 0;

            return {
                rank: idx + 1,
                participant: {
                    id: p.userId._id.toString(),
                    username: p.userId.username,
                },
                quiz: {
                    id: p.quizRoomId.quizId._id.toString(),
                    title: p.quizRoomId.quizId.title,
                },
                score: p.score,
                accuracy,
                finishedAt: p.finishedAt,
            };
        });

        /* ── recent activity (20) ── */
        const recentParts = (await Participation.find({ quizRoomId: { $in: roomIds } })
            .sort({ joinedAt: -1 })
            .limit(20)
            .populate({ path: 'userId', select: 'username' })
            .populate({ path: 'quizRoomId', populate: { path: 'quizId', select: 'title' } })
            .lean()
            .exec()) as unknown as PopParticipation[];

        const formattedRecent = recentParts.map(p => ({
            id: p._id.toString(),
            participant: {
                id: p.userId._id.toString(),
                username: p.userId.username,
            },
            quiz: {
                id: p.quizRoomId.quizId._id.toString(),
                title: p.quizRoomId.quizId.title,
            },
            completed: p.completed,
            score: p.score,
            joinedAt: p.joinedAt,
            finishedAt: p.finishedAt,
        }));

        /* ── assemble ── */
        const dashboardStats = {
            overview: {
                totalQuizzes,
                totalRooms,
                totalParticipations,
                completedParticipations,
                completionRate,
                averageScore,
            },
            topPerformers: formattedTop,
            recentActivity: formattedRecent,
        };

        return new Response(JSON.stringify(dashboardStats), { status: 200 });
    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch dashboard statistics' }),
            { status: 500 },
        );
    }
}
