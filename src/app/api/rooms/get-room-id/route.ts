import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { inviteCode } = await req.json();

        const room = await prisma.quizRoom.findUnique({
            where: { inviteCode },
        });

        if (!room) {
            return new Response(JSON.stringify({ error: 'Room not found' }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify({ roomId: room.id }), {
            status: 200,
        });
    } catch (error) {
        console.error('Error getting roomId from inviteCode:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
}
