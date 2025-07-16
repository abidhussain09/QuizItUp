// src/app/api/rooms/admin/[adminId]/route.ts
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

import '@/models/User';
import '@/models/Quiz';
import '@/models/QuizRoom';
import '@/models/Question';
import '@/models/Participation';

import User from '@/models/User';
import Quiz from '@/models/Quiz';
import QuizRoom from '@/models/QuizRoom';
import Question from '@/models/Question';
import Participation from '@/models/Participation';

export const dynamic = 'force-dynamic'; // always server‑side

export async function GET(req: Request) {
    await connectDB();

    /* ── extract adminId from pathname "/api/rooms/admin/[adminId]" ── */
    const { pathname } = new URL(req.url);
    // segments: ['', 'api', 'rooms', 'admin', '[adminId]']
    const segments = pathname.split('/');
    const adminId = segments[segments.indexOf('admin') + 1];

    try {
        /* ── validation ── */
        if (!adminId)
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), { status: 400 });

        if (!Types.ObjectId.isValid(adminId))
            return new Response(JSON.stringify({ error: 'Invalid Admin ID format' }), { status: 400 });

        /* ── verify admin ── */
        const admin = await User.findById(adminId).select('role').lean<{ role: string }>();

        if (!admin)
            return new Response(JSON.stringify({ error: 'Admin not found' }), { status: 404 });

        if (admin.role !== 'ADMIN')
            return new Response(
                JSON.stringify({ error: 'Access denied. Admin role required.' }),
                { status: 403 },
            );

        /* ── quizzes created by this admin ── */
        const quizzes = await Quiz.find({ creatorId: adminId })
            .select('_id title description duration createdAt')
            .lean<{ _id: Types.ObjectId; title: string; description: string; duration: number; createdAt: Date }[]>();

        const quizIds = quizzes.map(q => q._id);

        /* ── rooms for those quizzes ── */
        const rooms = await QuizRoom.find({ quizId: { $in: quizIds } })
            .sort({ createdAt: -1 })
            .populate({
                path: 'quizId',
                select: 'title description duration createdAt',
            })
            .lean<{
                _id: Types.ObjectId;
                inviteCode: string;
                createdAt: Date;
                startTime?: Date;
                endTime?: Date;
                quizId: {
                    _id: Types.ObjectId;
                    title: string;
                    description: string;
                    duration: number;
                    createdAt: Date;
                };
            }[]>();

        const roomIds = rooms.map(r => r._id);

        /* ── participations for all rooms ── */
        const participations = await Participation.find({ quizRoomId: { $in: roomIds } })
            .populate({ path: 'userId', select: 'username' })
            .lean<{
                _id: Types.ObjectId;
                quizRoomId: Types.ObjectId;
                userId: { _id: Types.ObjectId; username: string };
                joinedAt: Date;
                completed: boolean;
            }[]>();

        /* group participations by roomId */
        const partsByRoom = new Map<string, typeof participations>();
        participations.forEach(p => {
            const key = p.quizRoomId.toString();
            if (!partsByRoom.has(key)) partsByRoom.set(key, []);
            partsByRoom.get(key)!.push(p);
        });

        /* question counts per quiz */
        const questionCounts = await Question.aggregate([
            { $match: { quizId: { $in: quizIds } } },
            { $group: { _id: '$quizId', total: { $sum: 1 } } },
        ]);

        const questionsByQuiz = new Map<string, number>();
        questionCounts.forEach(q => questionsByQuiz.set(q._id.toString(), q.total));

        /* transform rooms */
        const now = new Date();
        const roomsWithStatus = rooms.map(room => {
            const quizDoc = room.quizId;
            const parts = partsByRoom.get(room._id.toString()) ?? [];
            const participantCount = parts.length;
            const completedCount = parts.filter(p => p.completed).length;
            const questionCount = questionsByQuiz.get(quizDoc._id.toString()) ?? 0;

            let status: 'active' | 'inactive' | 'no_questions' | 'not_started' | 'closed' = 'inactive';
            if (questionCount === 0) status = 'no_questions';
            else if (room.startTime && room.endTime) {
                if (now < room.startTime) status = 'not_started';
                else if (now > room.endTime) status = 'closed';
                else status = participantCount > 0 ? 'active' : 'inactive';
            } else if (participantCount > 0) status = 'active';

            return {
                id: room._id.toString(),
                inviteCode: room.inviteCode,
                createdAt: room.createdAt,
                startTime: room.startTime,
                endTime: room.endTime,
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                    createdAt: quizDoc.createdAt,
                    questionCount,
                },
                participantCount,
                completedParticipants: completedCount,
                status,
                participants: parts.map(p => ({
                    id: p._id.toString(),
                    joinedAt: p.joinedAt,
                    completed: p.completed,
                    user: p.userId,
                })),
            };
        });

        /* summary */
        const summary = {
            totalRooms: roomsWithStatus.length,
            activeRooms: roomsWithStatus.filter(r => r.status === 'active').length,
            totalParticipants: roomsWithStatus.reduce((s, r) => s + r.participantCount, 0),
        };

        return new Response(JSON.stringify({ rooms: roomsWithStatus, ...summary }), { status: 200 });
    } catch (err) {
        console.error('Error fetching admin rooms:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch rooms' }),
            { status: 500 },
        );
    }
}
