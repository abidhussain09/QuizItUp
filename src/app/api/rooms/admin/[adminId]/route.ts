import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'

import { Types } from 'mongoose'
import User from '@/models/User'
import Quiz from '@/models/Quiz'
import QuizRoom from '@/models/QuizRoom'
import Question from '@/models/Question'
import Participation from '@/models/Participation'

export const dynamic = 'force-dynamic'        

export async function GET(
    _req: NextRequest,
    { params }: { params: { adminId: string } },   
) {
    await connectDB()

    try {
        const { adminId } = params

        if (!adminId) {
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), { status: 400 })
        }
        if (!Types.ObjectId.isValid(adminId)) {
            return new Response(JSON.stringify({ error: 'Invalid Admin ID format' }), { status: 400 })
        }

        /* ───── verify admin user & role ───── */
        const admin = await User.findById(adminId).select('role')
        if (!admin) {
            return new Response(JSON.stringify({ error: 'Admin not found' }), { status: 404 })
        }
        if (admin.role !== 'ADMIN') {
            return new Response(
                JSON.stringify({ error: 'Access denied. Admin role required.' }),
                { status: 403 },
            )
        }

        /* ───── quizzes created by this admin ───── */
        const quizzes = await Quiz.find({ creatorId: adminId }).select(
            '_id title description duration createdAt',
        )
        const quizIds = quizzes.map(q => q._id)

        /* ───── rooms for those quizzes ───── */
        const rooms = await QuizRoom.find({ quizId: { $in: quizIds } })
            .sort({ createdAt: -1 })
            .populate({ path: 'quizId', select: 'title description duration createdAt' }) // correct path
            .exec()

        const roomIds = rooms.map(r => r._id)

        /* ───── participations for all rooms ───── */
        const participations = await Participation.find({ quizRoomId: { $in: roomIds } })
            .populate({ path: 'userId', select: 'username' })
            .exec()

        /* Group participations by roomId */
        const partsByRoom: Record<string, typeof participations> = {}
        participations.forEach(p => {
            const k = p.quizRoomId.toString()
            if (!partsByRoom[k]) partsByRoom[k] = []
            partsByRoom[k].push(p)
        })

        /* Count questions per quiz */
        const questionCounts = await Question.aggregate([
            { $match: { quizId: { $in: quizIds } } },           // use quizId field
            { $group: { _id: '$quizId', total: { $sum: 1 } } },
        ])
        const questionsByQuiz: Record<string, number> = {}
        questionCounts.forEach(q => { questionsByQuiz[q._id.toString()] = q.total })

        /* ───── transform rooms ───── */
        const now = new Date()
        const roomsWithStatus = rooms.map(room => {
            const quizDoc = room.quizId as unknown as {
                _id: Types.ObjectId
                title: string
                description: string
                duration: number
                createdAt: Date
            }

            const partsArr = partsByRoom[room._id.toString()] ?? []
            const participantCt = partsArr.length
            const completedCt = partsArr.filter(p => p.completed).length
            const qCount = questionsByQuiz[quizDoc._id.toString()] ?? 0

            let status: 'active' | 'inactive' | 'no_questions' | 'not_started' | 'closed' = 'inactive'
            if (qCount === 0) {
                status = 'no_questions'
            } else if (room.startTime && room.endTime) {
                if (now < room.startTime) status = 'not_started'
                else if (now > room.endTime) status = 'closed'
                else if (participantCt > 0) status = 'active'
                else status = 'inactive'
            } else if (participantCt > 0) {
                status = 'active'          // legacy rooms
            }

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
                    questionCount: qCount,
                },
                participantCount: participantCt,
                completedParticipants: completedCt,
                status,
                participants: partsArr.map(p => ({
                    id: p._id.toString(),
                    joinedAt: p.joinedAt,
                    completed: p.completed,
                    user: p.userId,        // populated { id, username }
                })),
            }
        })

        /* summary */
        const summary = {
            totalRooms: roomsWithStatus.length,
            activeRooms: roomsWithStatus.filter(r => r.status === 'active').length,
            totalParticipants: roomsWithStatus.reduce((sum, r) => sum + r.participantCount, 0),
        }

        return new Response(JSON.stringify({ rooms: roomsWithStatus, ...summary }), { status: 200 })
    } catch (err) {
        console.error('Error fetching admin rooms:', err)
        return new Response(JSON.stringify({ error: 'Failed to fetch rooms' }), { status: 500 })
    }
}
