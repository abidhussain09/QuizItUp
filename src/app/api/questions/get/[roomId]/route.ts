// app/api/rooms/[roomId]/questions/route.ts
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

import QuizRoom from '@/models/QuizRoom'
import Question from '@/models/Question'

export const dynamic = 'force-dynamic'   // always server‑side

export async function GET(
    _req: NextRequest,
    { params }: { params: { roomId: string } },
) {
    await connectDB()                      // open (or reuse) Mongo connection

    try {
        const { roomId } = params

        /* ───────────── validate roomId ───────────── */
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return new Response(
                JSON.stringify({ error: 'Invalid room ID format' }),
                { status: 400 },
            )
        }

        /* ───────────── find room + its quiz ───────────── */
        const room = await QuizRoom.findById(roomId)
            .populate({ path: 'quizId', model: 'Quiz' })  // brings in quiz doc
            .exec()

        if (!room) {
            return new Response(
                JSON.stringify({ error: 'Invalid room' }),
                { status: 404 },
            )
        }

        const quizDoc = room.quizId as any   // populated Quiz document

        /* ───────────── fetch questions for this quiz ───────────── */
        const questions = await Question.find({ quizId: quizDoc._id })
            .select('id text imageUrl optionA optionB optionC optionD marks')
            .exec()

        /* ───────────── respond ───────────── */
        return new Response(
            JSON.stringify({
                questions,
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                },
            }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Fetch Questions Error:', err)
        return new Response(
            JSON.stringify({ error: 'Something went wrong' }),
            { status: 500 },
        )
    }
}
