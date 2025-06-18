import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { title, description, creatorId, startTime, endTime } = await req.json();

        if (!title || !description || !creatorId || !startTime || !endTime) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
            });
        }

        const quizId = uuidv4();
        const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase();

        const createdQuiz = await prisma.quiz.create({
            data: {
                id: quizId,
                title,
                description,
                creatorId,
                quizRoom: {
                    create: {
                        id: uuidv4(),
                        inviteCode,
                        startTime: new Date(startTime),
                        endTime: new Date(endTime),
                    },
                },
            },
            include: {
                quizRoom: true,
            },
        });

        return new Response(JSON.stringify({
            quizId: createdQuiz.id,
            inviteCode: createdQuiz.quizRoom?.inviteCode,
            roomId: createdQuiz.quizRoom?.id,
        }), { status: 201 });
    } catch (err) {
        console.error('Create Quiz+Room Error:', err);
        return new Response(JSON.stringify({ error: 'Could not create quiz & room' }), {
            status: 500,
        });
    }
}
