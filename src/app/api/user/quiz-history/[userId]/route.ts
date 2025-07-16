import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Types } from 'mongoose'

import User from '@/models/User'
import Participation from '@/models/Participation'
import Question from '@/models/Question'
import ParticipantAnswer from '@/models/ParticipantAnswer'

export const dynamic = 'force-dynamic'

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } },
) {
    await connectDB()

    try {
        const { userId } = params

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
            })
        }
        if (!Types.ObjectId.isValid(userId)) {
            return new Response(JSON.stringify({ error: 'Invalid User ID' }), {
                status: 400,
            })
        }

        /* ────────── verify user ────────── */
        const user = await User.findById(userId).select('_id username email')
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
            })
        }

        /* ────────── fetch participations for user ────────── */
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
            .exec()

        const partIds = participations.map(p => p._id)
        const quizIds = participations.map(
            p => ((p.quizRoomId as any).quizId as Types.ObjectId)._id || (p.quizRoomId as any).quizId,
        )

        /* ────────── fetch answers & questions in bulk ────────── */
        const [answers, questions] = await Promise.all([
            ParticipantAnswer.find({ participationId: { $in: partIds } }).select(
                'participationId isCorrect marks',
            ),
            Question.find({ quizId: { $in: quizIds } }).select('quizId marks'),
        ])

        /* group answers by participation */
        const ansByPart: Record<string, typeof answers> = {}
        answers.forEach(a => {
            const k = (a.participationId as Types.ObjectId).toString()
            if (!ansByPart[k]) ansByPart[k] = []
            ansByPart[k].push(a)
        })

        /* group questions by quizId */
        const quesByQuiz: Record<string, typeof questions> = {}
        questions.forEach(q => {
            const k = q.quizId.toString()
            if (!quesByQuiz[k]) quesByQuiz[k] = []
            quesByQuiz[k].push(q)
        })

        /* ────────── build quiz history rows ────────── */
        const quizHistory = participations.map(p => {
            const quizDoc = (p.quizRoomId as any).quizId
            const qid = quizDoc._id.toString()
            const quesArr = quesByQuiz[qid] || []

            const ansArr = ansByPart[p._id.toString()] ?? []
            const correctAnswers = ansArr.filter(a => a.isCorrect).length
            const answeredQuestions = ansArr.length
            const totalQuestions = quesArr.length
            const accuracy =
                answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0
            const totalPossibleMarks = quesArr.reduce((sum, q) => sum + q.marks, 0)

            const completionTime =
                p.finishedAt && p.joinedAt
                    ? Math.round(
                        (p.finishedAt.getTime() - p.joinedAt.getTime()) / (1000 * 60),
                    )
                    : null

            return {
                id: p._id.toString(),
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
                totalPossibleMarks,
                completionTime,
                completed: p.completed,
                joinedAt: p.joinedAt,
                finishedAt: p.finishedAt,
                status: p.completed ? 'completed' : 'incomplete',
            }
        })

        /* ────────── aggregate user statistics ────────── */
        const completedQuizzes = quizHistory.filter(q => q.completed)
        const totalScore = completedQuizzes.reduce((s, q) => s + q.score, 0)
        const averageScore =
            completedQuizzes.length > 0
                ? Math.round(totalScore / completedQuizzes.length)
                : 0
        const totalCorrectAnswers = completedQuizzes.reduce((s, q) => s + q.correctAnswers, 0)
        const totalQuestionsAttempt = completedQuizzes.reduce(
            (s, q) => s + q.answeredQuestions,
            0,
        )
        const overallAccuracy =
            totalQuestionsAttempt > 0
                ? Math.round((totalCorrectAnswers / totalQuestionsAttempt) * 100)
                : 0

        const userStats = {
            totalQuizzes: participations.length,
            completedQuizzes: completedQuizzes.length,
            incompleteQuizzes: participations.length - completedQuizzes.length,
            totalScore,
            averageScore,
            overallAccuracy,
            totalCorrectAnswers,
            totalQuestionsAttempted: totalQuestionsAttempt,
        }

        /* ────────── respond ────────── */
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
            { status: 200 },
        )
    } catch (err) {
        console.error('Error fetching user quiz history:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to fetch quiz history' }),
            { status: 500 },
        )
    }
}
