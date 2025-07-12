import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'        
import Quiz from '@/models/Quiz'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'      

export async function POST(req: NextRequest) {
    await connectDB()                         

    try {
        const {
            title,
            description,
            duration,
            creatorId,
        }: {
            title: string
            description: string
            duration?: number
            creatorId: string
        } = await req.json()

        if (!title || !description || !creatorId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 },
            )
        }

        // Validate creatorId format
        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return new Response(
                JSON.stringify({ error: 'Invalid creatorId' }),
                { status: 400 },
            )
        }

        // Validate duration if provided
        if (duration !== undefined) {
            if (typeof duration !== 'number' || duration < 5 || duration > 180) {
                return new Response(
                    JSON.stringify({ error: 'Duration must be between 5 and 180 minutes' }),
                    { status: 400 },
                )
            }
        }


        const quizDoc = await Quiz.create({
            title,
            description,
            duration: duration ?? 30,      // default 30 min
            creatorId,
        })

        return new Response(
            JSON.stringify({
                quizId: quizDoc._id.toString(),
                duration: quizDoc.duration,
            }),
            { status: 201 },
        )
    } catch (err) {
        console.error('Error creating quiz:', err)
        return new Response(
            JSON.stringify({ error: 'Failed to create quiz' }),
            { status: 500 },
        )
    }
}
