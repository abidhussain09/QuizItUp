import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { inviteCode, userId }: { inviteCode: string; userId: string } = await req.json();

        if (!inviteCode || !userId) {
            return new Response(JSON.stringify({ error: 'Missing inviteCode or userId' }), {
                status: 400,
            });
        }

        const room = await prisma.quizRoom.findUnique({
            where: { inviteCode },
        });

        if (!room) {
            return new Response(JSON.stringify({ error: 'Invalid code' }), {
                status: 404,
            });
        }

        const existing = await prisma.participation.findFirst({
            where: { userId, quizRoomId: room.id },
        });

        if (existing) {
            return new Response(JSON.stringify({ error: 'Already joined this room' }), {
                status: 409,
            });
        }

        const participation = await prisma.participation.create({
            data: {
                userId,
                quizRoomId: room.id,
                joinedAt: new Date(),
                score: 0,
                completed: false,
            },
        });

        return new Response(
            JSON.stringify({ roomId: room.id, participationId: participation.id }),
            { status: 200 }
        );
    } catch (err) {
        console.error('Join Error:', err);
        return new Response(JSON.stringify({ error: 'Could not join room' }), {
            status: 500,
        });
    }
}
