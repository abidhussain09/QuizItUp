import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db';
import QuizRoom from '@/models/QuizRoom'
import Quiz from '@/models/Quiz'                    

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    await connectDB()                        

    try {
        const { quizId, startTime, endTime } = await req.json()

        if (!quizId) {
            return new Response(
                JSON.stringify({ error: 'Quiz ID is required' }),
                { status: 400 },
            )
        }

        const quizExists = await Quiz.exists({ _id: quizId })
        if (!quizExists) {
            return new Response(
                JSON.stringify({ error: 'Quiz not found' }),
                { status: 404 },
            )
        }

        // Date validation (if both provided)
        if (startTime && endTime) {
            const startDate = new Date(startTime)
            const endDate = new Date(endTime)

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return new Response(
                    JSON.stringify({ error: 'Invalid datetime format' }),
                    { status: 400 },
                )
            }
            if (endDate <= startDate) {
                return new Response(
                    JSON.stringify({ error: 'End time must be after start time' }),
                    { status: 400 },
                )
            }
            if (startDate < new Date()) {
                return new Response(
                    JSON.stringify({ error: 'Start time cannot be in the past' }),
                    { status: 400 },
                )
            }
        }

        let inviteCode: string
        do {
            inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase() // e.g. "A1B2C3"
        } while (await QuizRoom.exists({ inviteCode }))

        const newRoom = await QuizRoom.create({
            quizId,
            inviteCode,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
        })

        return new Response(
            JSON.stringify({
                roomId: newRoom._id,          
                inviteCode,
                startTime: newRoom.startTime,
                endTime: newRoom.endTime,
            }),
            { status: 201 },
        )
    } catch (err: any) {
        // Handle duplicate key errors (just in case)
        if (err.code === 11000) {            
            return new Response(
                JSON.stringify({ error: 'Invite code already exists, please retry' }),
                { status: 409 },
            )
        }

        console.error('Error creating room:', err)
        return new Response(
            JSON.stringify({ error: 'Room creation failed' }),
            { status: 500 },
        )
    }
}
