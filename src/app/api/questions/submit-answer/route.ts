import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

import Participation from '@/models/Participation'
import Question from '@/models/Question'
import ParticipantAnswer from '@/models/ParticipantAnswer'

export const dynamic = 'force-dynamic'   

export async function POST(req: NextRequest) {
    await connectDB()                      

    try {
        const {
            participationId,
            questionId,
            selectedOption,
        }: {
            participationId: string
            questionId: string
            selectedOption: string
        } = await req.json()

        
        if (!participationId || !questionId || !selectedOption) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required fields: participationId, questionId, selectedOption',
                }),
                { status: 400 },
            )
        }


        if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid selectedOption. Must be A, B, C, or D',
                }),
                { status: 400 },
            )
        }

        if (
            !mongoose.Types.ObjectId.isValid(participationId) ||
            !mongoose.Types.ObjectId.isValid(questionId)
        ) {
            return new Response(
                JSON.stringify({ error: 'Invalid participationId or questionId' }),
                { status: 400 },
            )
        }

        
        const participation = await Participation.findById(participationId)
            .populate({
                path: 'quizRoomId',
                populate: { path: 'quizId', model: 'Quiz' },
            })
            .exec()

        if (!participation) {
            return new Response(JSON.stringify({ error: 'Participation not found' }), {
                status: 404,
            })
        }

        if (participation.completed) {
            return new Response(JSON.stringify({ error: 'Quiz already completed' }), {
                status: 400,
            })
        }

        
        const question = await Question.findById(questionId).exec()
        if (!question) {
            return new Response(JSON.stringify({ error: 'Question not found' }), {
                status: 404,
            })
        }

        
        // const quizIdOfRoom = (participation.quizRoomId as any).quizId.toString()
        // if (question.quizId.toString() !== quizIdOfRoom) {
        //     return new Response(
        //         JSON.stringify({ error: 'Question does not belong to this quiz' }),
        //         { status: 400 },
        //     )
        // }

        
        const existing = await ParticipantAnswer.findOne({
            participationId,
            questionId,
        }).exec()

        if (existing) {
            return new Response(
                JSON.stringify({
                    error: 'Answer already submitted for this question',
                    currentAnswer: existing,
                }),
                { status: 400 },
            )
        }

        /* ───────────── create answer ───────────── */
        const isCorrect = question.correctOption === selectedOption
        const marksEarned = isCorrect ? question.marks : 0

        const participantAnswer = await ParticipantAnswer.create({
            participationId,
            questionId,
            selectedOption,
            isCorrect,
            marks: marksEarned,
            answeredAt: new Date(),
        })

        /* ───────────── recalculate total score ───────────── */
        const allAnswers = await ParticipantAnswer.find({ participationId }).exec()
        const totalScore = allAnswers.reduce((sum, a) => sum + a.marks, 0)

        /* ───────────── update participation.score ───────────── */
        await Participation.findByIdAndUpdate(participationId, { score: totalScore })

        /* ───────────── respond ───────────── */
        return new Response(
            JSON.stringify({
                success: true,
                answer: participantAnswer,
                totalScore,
                isCorrect,
                marksEarned,
                answeredQuestions: allAnswers.length,
            }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Error submitting answer:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to submit answer' }),
            { status: 500 },
        )
    }
}
