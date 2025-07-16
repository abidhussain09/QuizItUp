import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'

import mongoose from 'mongoose'
import Participation from '@/models/Participation'
import ParticipantAnswer from '@/models/ParticipantAnswer'
import Question from '@/models/Question'

export const dynamic = 'force-dynamic'          

export async function POST(req: NextRequest) {
    await connectDB()                             
    try {
        const { participationId }: { participationId: string } = await req.json()

        /* ─────────────── validation ─────────────── */
        if (!participationId) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: participationId' }),
                { status: 400 },
            )
        }
        if (!mongoose.Types.ObjectId.isValid(participationId)) {
            return new Response(
                JSON.stringify({ error: 'Invalid participationId' }),
                { status: 400 },
            )
        }

        /* ─────────────── load participation + quizRoom ─────────────── */
        const participation = await Participation.findById(participationId)
            .populate({
                path: 'quizRoomId',
                populate: { path: 'quizId', model: 'Quiz' },   // quizRoom.quizId → Quiz doc
            })
            .exec()

        if (!participation) {
            return new Response(JSON.stringify({ error: 'Participation not found' }), {
                status: 404,
            })
        }

        if (participation.completed) {
            return new Response(
                JSON.stringify({ error: 'Quiz already completed', participation }),
                { status: 400 },
            )
        }

        /* ─────────────── fetch all answers for this participation ─────────────── */
        const answers = await ParticipantAnswer.find({ participationId }).exec()

        const totalScore = answers.reduce((sum, a) => sum + a.marks, 0)
        const answeredQuestions = answers.length
        const correctAnswers = answers.filter(a => a.isCorrect).length

        /* ─────────────── determine total questions in the quiz ─────────────── */
        const quizId = (participation.quizRoomId as any).quizId as mongoose.Types.ObjectId
        const totalQuestions = await Question.countDocuments({ quizId })

        /* ─────────────── mark participation as completed ─────────────── */
        participation.completed = true
        participation.finishedAt = new Date()
        participation.score = totalScore
        await participation.save()

        /* ─────────────── populate user & minimal quiz info for response ─────────────── */
        const populated = await Participation.findById(participationId)
            .populate({ path: 'userId', select: 'username' })
            .populate({
                path: 'quizRoomId',
                populate: { path: 'quizId', select: 'title description' },
            })
            .exec()

        /* ─────────────── build response ─────────────── */
        return new Response(
            JSON.stringify({
                success: true,
                participation: {
                    id: populated!._id.toString(),
                    user: populated!.userId,
                    quizRoom: populated!.quizRoomId,
                    completed: populated!.completed,
                    finishedAt: populated!.finishedAt,
                    score: populated!.score,
                },
                results: {
                    totalScore,
                    totalQuestions,
                    answeredQuestions,
                    correctAnswers,
                    percentage:
                        totalQuestions > 0
                            ? Math.round((correctAnswers / totalQuestions) * 100)
                            : 0,
                },
            }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Error completing quiz:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to complete quiz' }),
            { status: 500 },
        )
    }
}
