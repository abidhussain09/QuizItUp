// app/api/admin/dashboard/route.ts
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose, { Types } from 'mongoose'

import User from '@/models/User'
import Quiz from '@/models/Quiz'
import QuizRoom from '@/models/QuizRoom'
import Participation from '@/models/Participation'
import ParticipantAnswer from '@/models/ParticipantAnswer'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    await connectDB()

    try {
        /* ────────── query‑param validation ────────── */
        const { searchParams } = new URL(req.url)
        const adminId = searchParams.get('adminId')

        if (!adminId) {
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), {
                status: 400,
            })
        }
        if (!Types.ObjectId.isValid(adminId)) {
            return new Response(JSON.stringify({ error: 'Invalid Admin ID' }), {
                status: 400,
            })
        }

        /* ────────── verify admin user & role ────────── */
        const admin = await User.findById(adminId).select('role username')
        if (!admin || admin.role !== 'ADMIN') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
            })
        }

        const adminObjId = new Types.ObjectId(adminId)

        /* ────────── fetch quiz & room IDs created by this admin ────────── */
        const quizzes = await Quiz.find({ creatorId: adminObjId }).select('_id').exec()
        const quizIds = quizzes.map(q => q._id)
        const rooms = await QuizRoom.find({ quizId: { $in: quizIds } }).select('_id').exec()
        const roomIds = rooms.map(r => r._id)

        /* ────────── basic counts ────────── */
        const [
            totalQuizzes,
            totalRooms,
            totalParticipations,
            completedParticipations,
            avgScoreAgg,
        ] = await Promise.all([
            quizzes.length,
            rooms.length,
            Participation.countDocuments({ quizRoomId: { $in: roomIds } }),
            Participation.countDocuments({ completed: true, quizRoomId: { $in: roomIds } }),
            Participation.aggregate([
                { $match: { completed: true, quizRoomId: { $in: roomIds } } },
                { $group: { _id: null, avgScore: { $avg: '$score' } } },
            ]),
        ])

        const averageScore =
            avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 0
        const completionRate =
            totalParticipations > 0
                ? Math.round((completedParticipations / totalParticipations) * 100)
                : 0

        /* ────────── top performers (limit 10) ────────── */
        const topParts = await Participation.find({
            completed: true,
            quizRoomId: { $in: roomIds },
        })
            .sort({ score: -1, finishedAt: 1 })
            .limit(10)
            .populate({ path: 'userId', select: 'username' })
            .populate({
                path: 'quizRoomId',
                populate: { path: 'quizId', select: 'title' },
            })
            .exec()

        /* gather answers for accuracy calc */
        const topPartIds = topParts.map(p => p._id)
        const topAnswers = await ParticipantAnswer.find({
            participationId: { $in: topPartIds },
        }).exec()

        const ansByPart: Record<string, typeof topAnswers> = {}
        topAnswers.forEach(a => {
            const k = (a.participationId as Types.ObjectId).toString()
            if (!ansByPart[k]) ansByPart[k] = []
            ansByPart[k].push(a)
        })

        const formattedTopPerformers = topParts.map((p, idx) => {
            const answers = ansByPart[p._id.toString()] ?? []
            const correct = answers.filter(a => a.isCorrect).length
            const acc =
                answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0
            const quizDoc = (p.quizRoomId as any).quizId

            return {
                rank: idx + 1,
                participant: {
                    id: (p.userId as any)._id.toString(),
                    username: (p.userId as any).username,
                },
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                },
                score: p.score,
                accuracy: acc,
                finishedAt: p.finishedAt,
            }
        })

        /* ────────── recent activity (last 20 joins) ────────── */
        const recent = await Participation.find({
            quizRoomId: { $in: roomIds },
        })
            .sort({ joinedAt: -1 })
            .limit(20)
            .populate({ path: 'userId', select: 'username' })
            .populate({
                path: 'quizRoomId',
                populate: { path: 'quizId', select: 'title' },
            })
            .exec()

        const formattedRecentActivity = recent.map(p => ({
            id: p._id.toString(),
            participant: {
                id: (p.userId as any)._id.toString(),
                username: (p.userId as any).username,
            },
            quiz: {
                id: (p.quizRoomId as any).quizId._id.toString(),
                title: (p.quizRoomId as any).quizId.title,
            },
            completed: p.completed,
            score: p.score,
            joinedAt: p.joinedAt,
            finishedAt: p.finishedAt,
        }))

        /* ────────── assemble dashboard stats ────────── */
        const dashboardStats = {
            overview: {
                totalQuizzes,
                totalRooms,
                totalParticipations,
                completedParticipations,
                completionRate,
                averageScore,
            },
            topPerformers: formattedTopPerformers,
            recentActivity: formattedRecentActivity,
        }

        return new Response(JSON.stringify(dashboardStats), { status: 200 })
    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to fetch dashboard statistics' }),
            { status: 500 },
        )
    }
}
