import mongoose from 'mongoose'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'

import '@/models/User';
import '@/models/Quiz';
import '@/models/QuizRoom';
import '@/models/Participation';
import '@/models/ParticipantAnswer';

import Participation from '@/models/Participation'
import ParticipantAnswer from '@/models/ParticipantAnswer'
import Quiz from '@/models/Quiz'
import User from '@/models/User'

export const dynamic = 'force-dynamic'   // always server‑side

export async function GET(req: NextRequest) {
    await connectDB()

    try {
        const { searchParams } = new URL(req.url)
        const limit = Math.abs(parseInt(searchParams.get('limit') || '10')) || 10

        const participations = await Participation.find({ completed: true })
            .sort({ score: -1, finishedAt: 1 })
            .limit(limit)
            .populate({ path: 'userId', select: 'username' })
            .populate({
                path: 'quizRoomId',
                populate: {
                    path: 'quizId',
                    model: 'Quiz',
                    select: 'title description duration creatorId createdAt',
                },
            })
            .exec()

        const participationIds = participations.map(p => p._id)

        /* ────────── load all answers in one query for accuracy calculation ────────── */
        const answers = await ParticipantAnswer.find({
            participationId: { $in: participationIds },
        }).exec()

        const answersByPart: Record<string, typeof answers> = {}
        answers.forEach(a => {
            const key = (a.participationId as mongoose.Types.ObjectId).toString()
            if (!answersByPart[key]) answersByPart[key] = []
            answersByPart[key].push(a)
        })

        /* ────────── build global leaderboard rows ────────── */
        const globalLeaderboard = participations.map((p, idx) => {
            const ansArr = answersByPart[p._id.toString()] ?? []
            const correctAnswers = ansArr.filter(a => a.isCorrect).length
            const answeredQuestions = ansArr.length

            const quizDoc = (p.quizRoomId as any).quizId
            const totalQuestions = quizDoc.questions ? quizDoc.questions.length : 0 // may rely on separate Question model for marks; not critical for accuracy

            const accuracy =
                answeredQuestions > 0
                    ? Math.round((correctAnswers / answeredQuestions) * 100)
                    : 0

            const completionTime =
                p.finishedAt && p.joinedAt
                    ? Math.round(
                        (p.finishedAt.getTime() - p.joinedAt.getTime()) / (1000 * 60),
                    )
                    : null

            return {
                rank: idx + 1,
                participant: {
                    id: (p.userId as any)._id.toString(),
                    username: (p.userId as any).username,
                },
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                    createdBy: quizDoc.creatorId,
                    createdAt: quizDoc.createdAt,
                },
                roomId: p.quizRoomId.toString(),
                score: p.score,
                correctAnswers,
                totalQuestions,
                answeredQuestions,
                accuracy,
                completionTime,
                finishedAt: p.finishedAt,
                joinedAt: p.joinedAt,
            }
        })

        /* ────────── platform‑wide statistics ────────── */
        const [totalQuizzes, totalParticipations, totalUsers, avgScoreAgg] =
            await Promise.all([
                Quiz.countDocuments(),
                Participation.countDocuments({ completed: true }),
                User.countDocuments(),
                Participation.aggregate([
                    { $match: { completed: true } },
                    { $group: { _id: null, avgScore: { $avg: '$score' } } },
                ]),
            ])

        const averageScore =
            avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 0

        const platformStats = {
            totalQuizzes,
            totalParticipations,
            totalUsers,
            averageScore,
        }

        return new Response(
            JSON.stringify({ globalLeaderboard, platformStats }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Error fetching global leaderboard:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to fetch global leaderboard' }),
            { status: 500 },
        )
    }
}
