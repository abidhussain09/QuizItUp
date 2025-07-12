import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'           
import QuizRoom from '@/models/QuizRoom'

export const dynamic = 'force-dynamic'        

export async function POST(req: NextRequest) {
    await connectDB()                           

    try {
        const { inviteCode } = await req.json()

        // Basic validation
        if (!inviteCode) {
            return new Response(
                JSON.stringify({ error: 'inviteCode is required' }),
                { status: 400 },
            )
        }

        
        const code = inviteCode.trim().toUpperCase()

        const room = await QuizRoom.findOne({ inviteCode: code })

        if (!room) {
            return new Response(
                JSON.stringify({ error: 'Room not found' }),
                { status: 404 },
            )
        }

        return new Response(
            JSON.stringify({ roomId: room._id.toString() }),
            { status: 200 },
        )
    } catch (err) {
        console.error('Error getting roomId from inviteCode:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 },
        )
    }
}
