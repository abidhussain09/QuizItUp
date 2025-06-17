import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { title, description, creatorId } = await req.json();

        if (!title || !description || !creatorId) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
            });
        }

        const quiz = await prisma.quiz.create({
            data: {
                id: uuidv4(),
                title,
                description,
                creatorId,
            },
        });

        return new Response(JSON.stringify({ quizId: quiz.id }), { status: 201 });
    } catch (error) {
        console.error('Error creating quiz:', error);
        return new Response(JSON.stringify({ error: 'Failed to create quiz' }), {
            status: 500,
        });
    }
}
