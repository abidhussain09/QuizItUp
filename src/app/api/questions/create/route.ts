import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

import Question from '@/models/Question'
import Quiz from '@/models/Quiz'

export const dynamic = 'force-dynamic'   

export async function POST(req: NextRequest) {
    await connectDB()                      

    try {
        const {
            quizId,
            text,
            imageUrl,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            marks,
        }: {
            quizId: string
            text: string
            imageUrl?: string
            optionA: string
            optionB: string
            optionC: string
            optionD: string
            correctOption: string
            marks: number
        } = await req.json()

        
        if (
            !quizId || !text ||
            !optionA || !optionB ||
            !optionC || !optionD ||
            !correctOption || marks === undefined
        ) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 },
            )
        }

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return new Response(
                JSON.stringify({ error: 'Invalid quizId' }),
                { status: 400 },
            )
        }

        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
            return new Response(
                JSON.stringify({ error: 'correctOption must be one of A, B, C, D' }),
                { status: 400 },
            )
        }

        if (typeof marks !== 'number' || marks < 0) {
            return new Response(
                JSON.stringify({ error: 'marks must be a positive number' }),
                { status: 400 },
            )
        }

        /* ─────── optional: verify quiz exists ─────── */
        const quizExists = await Quiz.exists({ _id: quizId })
        if (!quizExists) {
            return new Response(
                JSON.stringify({ error: 'Quiz not found' }),
                { status: 404 },
            )
        }

        /* ───────────── create question ───────────── */
        const questionDoc = await Question.create({
            quizId,
            text,
            imageUrl: imageUrl ?? undefined,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            marks,
        })

        return new Response(
            JSON.stringify({ success: true, question: questionDoc }),
            { status: 201 },
        )
    } catch (err) {
        console.error('Error creating question:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to create question' }),
            { status: 500 },
        )
    }
}
