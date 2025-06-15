import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { quizId } = await req.json();
        const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase();

        const newRoom = await prisma.quizRoom.create({
            data: {
                id: uuidv4(),
                quizId,
                inviteCode,
                startTime: null,
                endTime: null,
            },
        });

        return new Response(JSON.stringify({ roomId: newRoom.id, inviteCode }), {
            status: 201,
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return new Response(JSON.stringify({ error: 'Room creation failed' }), {
            status: 500,
        });
    }
}
