import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'          
import QuizRoom from '@/models/QuizRoom'
// import Question from '@/models/Question'
import Participation from '@/models/Participation'

export const dynamic = 'force-dynamic'        

export async function POST(req: NextRequest) {
    await connectDB()                           

    try {
        const {
            inviteCode,
            userId,
        }: { inviteCode: string; userId: string } = await req.json()

        if (!inviteCode || !userId) {
            return new Response(
                JSON.stringify({ error: 'Missing inviteCode or userId' }),
                { status: 400 },
            )
        }

        /* ─────────────────────────── Find the room ─────────────────────────── */
        const code = inviteCode.trim().toUpperCase()
        const room = await QuizRoom.findOne({ inviteCode: code })

        if (!room) {
            return new Response(
                JSON.stringify({ error: 'Invalid invite code' }),
                { status: 404 },
            )
        }

        /* ───────────── Check that the underlying quiz has questions ────────── */
        // const quizId = room.quizId
        // const questionsCount = await Question.countDocuments({ quiz: quizId })
        // if (questionsCount === 0) {
        //     return new Response(
        //         JSON.stringify({
        //             error: 'This quiz has no questions yet. Please try again later.',
        //         }),
        //         { status: 400 },
        //     )
        // }

        /* ─────────────── Time‑based availability checks ─────────────── */
        const now = new Date()
        if (room.startTime && room.endTime) {
            if (now < room.startTime) {
                return new Response(
                    JSON.stringify({
                        error: 'Quiz has not started yet',
                        startTime: room.startTime.toISOString(),
                    }),
                    { status: 400 },
                )
            }
            if (now > room.endTime) {
                return new Response(
                    JSON.stringify({
                        error: 'Quiz has ended and is no longer accepting participants',
                        endTime: room.endTime.toISOString(),
                    }),
                    { status: 400 },
                )
            }
        }

        /* ──────────── Check for existing participation ──────────── */
        const existing = await Participation.findOne({
            userId,
            quizRoomId: room._id,
        })

        if (existing) {
            return new Response(
                JSON.stringify({
                    message: 'Already joined',
                    roomId: room._id.toString(),
                    participationId: existing._id.toString(),
                }),
                { status: 200 },
            )
        }

        /* ─────────────── Create new participation doc ─────────────── */
        const participation = await Participation.create({
            userId,
            quizRoomId: room._id,
            joinedAt: new Date(),
            score: 0,
            completed: false,
        })

        return new Response(
            JSON.stringify({
                roomId: room._id.toString(),
                participationId: participation._id.toString(),
            }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Join Error:', err)
        return new Response(
            JSON.stringify({ error: 'Could not join room' }),
            { status: 500 },
        )
    }
}
