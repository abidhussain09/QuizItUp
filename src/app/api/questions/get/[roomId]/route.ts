import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
    try {
        const roomId = params.roomId;

        const room = await prisma.quizRoom.findUnique({
            where: { id: roomId },
            include: { quiz: true },
        });

        if (!room) {
            return new Response(JSON.stringify({ error: 'Invalid room' }), { status: 404 });
        }

        const questions = await prisma.question.findMany({
            where: { quizId: room.quizId },
            select: {
                id: true,
                text: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                marks: true,
            }
        });

        return new Response(JSON.stringify({
            questions,
            quiz: {
                id: room.quiz.id,
                title: room.quiz.title,
                description: room.quiz.description,
                duration: room.quiz.duration
            }
        }), { status: 200 });
    } catch (error) {
        console.error('Fetch Questions Error:', error);
        return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500 });
    }
}
